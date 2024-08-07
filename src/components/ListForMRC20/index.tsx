import { useModel } from "umi"
import usePageList from "@/hooks/usePageList"
import { getMrc20AddressUtxo, getUserMrc20List, sellMRC20Order, transferMrc20Commit, transfertMrc20Pre } from "@/services/api"
import { useEffect, memo, useState, useCallback, useMemo } from "react"
import { Button, Card, ConfigProvider, Descriptions, InputNumber, List, message } from "antd"
import { CheckOutlined } from "@ant-design/icons"
import { formatSat } from "@/utils/utlis"
import { listMrc20Order, transferMRC20PSBT } from "@/utils/mrc20"
import SuccessModal, { DefaultSuccessProps, SuccessProps } from "../SuccessModal"
import MRC20Icon from "../MRC20Icon"
import NumberFormat from "../NumberFormat"
import Decimal from "decimal.js"
import { getPkScriprt } from "@/utils/orders"
import { addUtxoSafe } from "@/utils/psbtBuild"
import Item from "@/components/Mrc20List/Item";
import './index.less'

const tags: Record<string, string> = {
    "MRC-20": "",
    "ID-Coins": "id-coins",


}

const ListForMRC20 = ({ tag = 'MRC-20', tick = '' }: { tag?: string, tick?: string }) => {
    const { btcAddress, connect, connected, network, authParams, feeRate } =
        useModel("wallet");
    const [list, setList] = useState<API.UserMrc20Asset[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [successProp, setSuccessProp] =
        useState<SuccessProps>(DefaultSuccessProps);
    const [checkList, setCheckList] = useState<string[]>([]);
    const [sellPrices, setSellPrices] = useState<Record<string, number>>({});
    const [sellAmounts, setSellAmounts] = useState<Record<string, number>>({});
    const [submiting, setSubmiting] = useState<boolean>(false);
    const fetchList = useCallback(async () => {
        if (!btcAddress) return;
        setLoading(true);
        const { code, data } = await getUserMrc20List(network, { address: btcAddress, cursor: 0, size: 50 });
        let _list: API.UserMrc20Asset[] = data && data.list || []
        if (tick) {
            _list = _list.filter((item) => item.tick.toUpperCase() === tick.toUpperCase())
        }
        if (_list.length > 0) {
            for (let i = 0; i < _list.length; i++) {
                const { data: utxoList, code } = await getMrc20AddressUtxo(network, { address: btcAddress, tickId: _list[i].mrc20Id, cursor: 0, size: 100 }, {
                    headers: {
                        ...authParams,
                    },
                });
                if (code !== 0) { continue }
                const mrc20s: {
                    amount: string;
                    decimals: string;
                    mrc20Id: string;
                    tick: string;
                    txPoint: string;
                }[] = []
                if (utxoList.list.length === 0) continue
                _list[i].tag = utxoList.list[0].tag
                const avlBal = utxoList.list.reduce((a, item) => {
                    if (item.orderId === '' && tags[tag] === item.tag && item.blockHeight !== -1) {
                        const utxoAmount = item.mrc20s.reduce((a, b) => {
                            mrc20s.push(b)
                            return a + Number(b.amount)
                        }, 0);
                        return a + utxoAmount
                    }
                    return a
                }, 0)
                const unconfirmedBal = utxoList.list.reduce((a, item) => {
                    if (item.orderId === '' && tags[tag] === item.tag && item.blockHeight === -1) {
                        const utxoAmount = item.mrc20s.reduce((a, b) => {
                            return a + Number(b.amount)
                        }, 0);
                        return a + utxoAmount
                    }
                    return a
                }, 0)
                const listedBal = utxoList.list.reduce((a, item) => {
                    if (item.orderId !== '' && tags[tag] === item.tag) {
                        const utxoAmount = item.mrc20s.reduce((a, b) => {
                            return a + Number(b.amount)
                        }, 0);
                        return a + utxoAmount
                    }
                    return a
                }, 0)

                _list[i].avlBalance = avlBal.toFixed(Number(_list[i].decimals))
                _list[i].unconfirmedBalance = unconfirmedBal.toFixed(Number(_list[i].decimals))
                _list[i].listedBalance = listedBal.toFixed(Number(_list[i].decimals))
                _list[i].mrc20s = mrc20s
            }
        }
        setList(_list.filter((item) => item.tag === tags[tag]));
        setLoading(false)


    }, [btcAddress, network, tag, tick])
    useEffect(() => {
        fetchList()
    }, [fetchList])
    const handleCheck = (txPoint: string) => {
        if (checkList.includes(txPoint)) {
            setCheckList(checkList.filter((item) => item !== txPoint));
        } else {
            setCheckList([...checkList, txPoint]);
        }
    };
    const onInputChange = (txPoint: string, amount: number) => {
        setSellPrices((prev) => {
            return {
                ...prev,
                [txPoint]: amount,
            };
        });
    };

    const onAmountInputChange = (txPoint: string, amount: number) => {
        setSellAmounts((prev) => {
            return {
                ...prev,
                [txPoint]: amount,
            };
        });
    };


    const totalStas = useMemo(() => {
        const total = checkList.reduce((a, b) => {
            return a + sellPrices[b] || 0;
        }, 0);
        return total;
    }, [checkList, sellPrices]);

    const listItem = async (mrc20Id: string, price: number, amount: number) => {
        if (!btcAddress) return
        const mrc20 = list.find((item) => item.mrc20Id === mrc20Id);
        if (!mrc20 || !mrc20.mrc20s) return;
        const findMrc20 = mrc20.mrc20s.find((item) => Number(item.amount) === amount);
        if (findMrc20) {
            const utxo: API.UTXO = {
                txId: findMrc20.txPoint.split(':')[0],
                satoshi: 546,
                satoshis: 546,
                vout: Number(findMrc20.txPoint.split(':')[1]),
                outputIndex: Number(findMrc20.txPoint.split(':')[1]),
                confirmed: true
            }
            const psbtRaw = await listMrc20Order(utxo, Number(new Decimal(price).times(1e8).toFixed(0)), network, btcAddress);
            const { code, message } = await sellMRC20Order(network, { assetType: 'mrc20', tickId: mrc20Id, address: btcAddress, psbtRaw }, {
                headers: {
                    ...authParams,
                },
            })
            if (code !== 0) {
                throw new Error(message)
            }
            return
        };
        // transferMRC20
        const { data: utxoList } = await getMrc20AddressUtxo(network, { address: btcAddress, tickId: String(mrc20Id), cursor: 0, size: 100 }, {
            headers: {
                ...authParams,
            },
        });
        if (utxoList.list.length === 0) throw new Error('No UTXO');
        const selectedUtxos = [];
        let totalAmount = 0;
        for (const utxo of utxoList.list) {
            if (utxo.orderId !== '') continue;
            for (const tick of utxo.mrc20s) {
                if (Number(tick.amount) > 0) {
                    totalAmount += Number(tick.amount)
                    selectedUtxos.push({
                        utxoIndex: utxo.outputIndex,
                        utxoTxId: utxo.txId,
                        utxoOutValue: utxo.satoshi,
                        tickerId: mrc20Id,
                        amount: tick.amount,
                        address: utxo.address,
                        pkScript: utxo.scriptPk
                    })
                }
                if (totalAmount >= amount) {
                    break
                }
            }
            if (totalAmount >= amount) {
                break
            }
        }
        if (totalAmount < amount) {
            throw new Error('No available UTXOs. Please wait for existing transactions to be confirmed. ')
        }

        const params: API.TransferMRC20PreReq = {
            networkFeeRate: feeRate,
            tickerId: mrc20Id,
            changeAddress: btcAddress,
            changeOutValue: 546,
            transfers: selectedUtxos,
            mrc20Outs: [{ amount: String(amount), address: btcAddress, outValue: 546, pkScript: getPkScriprt(btcAddress, network).toString('hex') }]
        }

        const { code, message, data } = await transfertMrc20Pre(network, params, {
            headers: {
                ...authParams,
            },
        })
        if (code !== 0) throw new Error(message);

        const { rawTx, revealPrePsbtRaw } = await transferMRC20PSBT(data, feeRate, btcAddress, network);
        console.log(revealPrePsbtRaw, 'revealPrePsbtRaw', rawTx);
        const ret = await transferMrc20Commit(network, { orderId: data.orderId, commitTxRaw: rawTx, commitTxOutIndex: 0, revealPrePsbtRaw }, { headers: { ...authParams } });
        if (ret.code !== 0) throw new Error(ret.message);
        await addUtxoSafe(btcAddress, [{ txId: ret.data.commitTxId, vout: 1 }])
        const utxo: API.UTXO = {
            txId: ret.data.revealTxId,
            satoshi: 546,
            satoshis: 546,
            vout: 1,
            outputIndex: 1,
            confirmed: false
        }
        const psbtRaw = await listMrc20Order(utxo, Number(new Decimal(price).times(1e8).toFixed(0)), network, btcAddress);
        const listRes = await sellMRC20Order(network, {
            assetType: 'mrc20',
            tickId: mrc20Id,
            address: btcAddress,
            psbtRaw,
            askType: 1,
            coinAmountStr: amount.toString(),
            utxoOutValue: 546,
        }, {
            headers: {
                ...authParams,
            },
        })
        if (listRes.code !== 0) throw new Error(listRes.message)




    }

    const handleSale = async () => {
        if (checkList.length === 0) return;
        for (let i = 0; i < checkList.length; i++) {
            if (!sellPrices[checkList[i]]) {
                const order = list.find((item) => item.mrc20Id === checkList[i]);
                message.error(` ${order!.tick} No price set yet`);
                return;
            }
            if (!sellAmounts[checkList[i]]) {
                const order = list.find((item) => item.mrc20Id === checkList[i]);
                message.error(` ${order!.tick} No list amount set yet`);
                return;
            }
        }
        setSubmiting(true)
        for (let i = 0; i < checkList.length; i++) {
            const order = list.find((item) => item.mrc20Id === checkList[i]);
            if (!order) continue
            try {
                await listItem(order.mrc20Id, sellPrices[checkList[i]], sellAmounts[checkList[i]]);
            } catch (err: any) {
                console.log(err);
                message.error(` ${order!.tick}: ${err.message}`);
                await fetchList();
                setSubmiting(false)
                return;
            }
        }
        setSuccessProp({
            show: true,
            onClose: () => setSuccessProp(DefaultSuccessProps),
            onDown: () => setSuccessProp(DefaultSuccessProps),
            title: "List For Sale",
            tip: "Successful",
            children: <div className="saleSuccess"></div>,
        });
        setSellPrices({});
        setSellAmounts({});
        setCheckList([]);
        setSubmiting(false)
        await fetchList();
    };

    return <>
        <List
            className="listWrap listMrc20"
            loading={loading}
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
            dataSource={list}
            rowKey={"mrc20Id"}
            renderItem={(item) => (
                <List.Item>
                    <Card
                        styles={{ body: { padding: 0 } }}
                        className={
                            checkList.includes(item.mrc20Id)
                                ? "sellCard checked"
                                : "sellCard"
                        }
                    >
                        <div className="cardWrap">
                            <div
                                className="contetn"
                                onClick={() => {
                                    Number(item.avlBalance) > 0 && handleCheck(item.mrc20Id);
                                }}
                            >


                                <div className="checkBox">
                                    {checkList.includes(item.mrc20Id) ? (
                                        <div className="checked">
                                            <CheckOutlined />
                                        </div>
                                    ) : (
                                        <div className="unchecked"></div>
                                    )}
                                </div>
                                <div className="tick">

                                    <Item info={{ tick: item.tick, mrc20Id: item.mrc20Id, metaData: '' }} />
                                </div>
                                <div className="tickAmount" >

                                    <Descriptions labelStyle={{ color: '#FFFFFF', display: 'flex', alignItems: 'center' }}
                                        contentStyle={{ flexGrow: 1, justifyContent: 'flex-end', color: 'rgba(255, 255, 255, 0.5)', whiteSpace: 'nowrap' }}
                                        column={1} items={
                                            [
                                                {
                                                    key: '1',
                                                    label: 'Available',
                                                    children: <NumberFormat value={item.avlBalance} precision={item.decimals} suffix={` ${item.tick}`} />
                                                },
                                                {
                                                    key: '2',
                                                    label: 'Listed',
                                                    children: <NumberFormat value={item.listedBalance} precision={item.decimals} suffix={` ${item.tick}`} />
                                                },
                                                {
                                                    key: '3',
                                                    label: 'Unconfirmed',
                                                    children: <NumberFormat value={item.unconfirmedBalance} precision={item.decimals} suffix={` ${item.tick}`} />
                                                },
                                            ]
                                        } />

                                </div>
                            </div>
                            <div className="inputGroup">
                                <div className="inputWrap">
                                    <div className="label">
                                        Quantity
                                    </div>
                                    <InputNumber
                                        onChange={(value) => onAmountInputChange(item.mrc20Id, value)}
                                        controls={false}
                                        className="input"
                                        value={sellAmounts[item.mrc20Id]}
                                        // suffix={item.tick}
                                        precision={Number(item.decimals)}
                                        placeholder="Quantity"
                                        disabled={Number(item.avlBalance) === 0}
                                        // min={(Number(item.amount) / 1e8) < 0.00002 ? 0.00002 : Number(new Decimal(item.amount).div(1e8).toFixed(8))}
                                        max={item.avlBalance}
                                        onFocus={() => {
                                            !checkList.includes(item.mrc20Id) && handleCheck(item.mrc20Id);
                                        }}
                                    />
                                </div>

                                <div className="inputWrap">
                                    <div className="label">
                                        Price
                                    </div>
                                    <InputNumber
                                        onChange={(value) => onInputChange(item.mrc20Id, value)}
                                        controls={false}
                                        className="input"
                                        value={sellPrices[item.mrc20Id]}
                                        suffix="BTC"
                                        placeholder="Price"
                                        disabled={Number(item.avlBalance) === 0}
                                        // min={(Number(item.amount) / 1e8) < 0.00002 ? 0.00002 : Number(new Decimal(item.amount).div(1e8).toFixed(8))}
                                        min={0.00002}
                                        onFocus={() => {
                                            !checkList.includes(item.mrc20Id) &&handleCheck(item.mrc20Id);
                                        }}
                                    />
                                </div>
                            </div>



                            {/* <div className="btcAmount">
                                {formatSat(sellPrices[item.txPoint] || 0)} BTC
                            </div> */}
                        </div>
                    </Card>
                </List.Item>
            )}
        />
        <div className="totalPrice">
            <div className="label">Total Price</div>
            <div className="aciotns">
                <div className="prices">
                    <div className="sats"><NumberFormat value={totalStas} suffix=" BTC" /> </div>
                    {/* <div className="btc">{formatSat(totalStas)}BTC</div> */}
                </div>
                {connected ? (
                    <Button
                        type="primary"
                        disabled={totalStas === 0}
                        onClick={handleSale}
                        loading={submiting}
                    >
                        List For Sale
                    </Button>
                ) : (
                    <Button type="primary" onClick={connect}>
                        Connect Wallet
                    </Button>
                )}
            </div>
        </div>
        <SuccessModal {...successProp}></SuccessModal>
    </>
}
export default memo(ListForMRC20)
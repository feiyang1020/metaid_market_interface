/**
 * Doge MRC-20 上架组件
 * 显示用户的 Doge MRC-20 资产列表并提供上架功能
 * 样式与 BTC MRC-20 保持一致
 */
import { useModel } from "umi"
import { getMrc20AddressUtxo, getMrc20Info, getUserMrc20List, sellMRC20Order } from "@/services/api"
import { useEffect, memo, useState, useCallback, useMemo } from "react"
import { Button, Card, ConfigProvider, Descriptions, InputNumber, List, message } from "antd"
import { CheckOutlined } from "@ant-design/icons"
import { formatMessage, formatSat } from "@/utils/utlis"
import SuccessModal, { DefaultSuccessProps, SuccessProps } from "../SuccessModal"
import MRC20Icon from "../MRC20Icon"
import NumberFormat from "../NumberFormat"
import Decimal from "decimal.js"
import Item from "@/components/Mrc20List/Item";
import '../ListForMRC20/index.less'
import Trans from "../Trans"
import USDPrice from "../USDPrice"
import ChainIcon from "../ChainIcon"
import { getDogeSource, DOGE_SATS_PER_COIN } from "@/utils/doge"
import { listDogeMrc20Order } from "@/utils/dogeMrc20"

const tags: Record<string, string> = {
    "MRC-20": "",
    "ID-Coins": "id-coins",
}

type DogeListItem = API.UserMrc20Asset & {
    mrc20s?: {
        amount: string;
        decimals: string;
        mrc20Id: string;
        tick: string;
        txPoint: string;
        satoshi?: number;
        satoshis?: number;
    }[];
};

const ListForDogeMRC20 = ({ tag = 'MRC-20', tick = '' }: { tag?: string, tick?: string }) => {
    const { dogeAddress, connect, connected, network, dogeAuthParams, dogeFeeRate, dogePrice } =
        useModel("wallet");
    const [list, setList] = useState<DogeListItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [successProp, setSuccessProp] =
        useState<SuccessProps>(DefaultSuccessProps);
    const [checkList, setCheckList] = useState<string[]>([]);
    const [sellPrices, setSellPrices] = useState<Record<string, number>>({});
    const [sellAmounts, setSellAmounts] = useState<Record<string, number>>({});
    const [submiting, setSubmiting] = useState<boolean>(false);

    const fetchList = useCallback(async () => {
        if (!dogeAddress) return;
        setLoading(true);
        try {
            const { code, data } = await getUserMrc20List(network, { 
                address: dogeAddress, 
                cursor: 0, 
                size: 50,
                source: getDogeSource()
            });
            let _list: DogeListItem[] = data && data.list || []
            if (tick) {
                _list = _list.filter((item) => item.tick.toUpperCase() === tick.toUpperCase())
            }
            if (_list.length > 0) {
                for (let i = 0; i < _list.length; i++) {
                    const _tickInfo = await getMrc20Info(network, { 
                        tickId: _list[i].mrc20Id,
                        source: getDogeSource()
                    });
                    const { data: utxoList, code } = await getMrc20AddressUtxo(network, { 
                        address: dogeAddress, 
                        tickId: _list[i].mrc20Id, 
                        cursor: 0, 
                        size: 100,
                        source: getDogeSource()
                    }, {
                        headers: {
                            ...dogeAuthParams,
                        },
                    });
                    if (code !== 0) { continue }
                    const mrc20s: DogeListItem['mrc20s'] = []
                    if (utxoList.list.length === 0) continue
                    _list[i].tag = utxoList.list[0].tag
                    const avlBal = utxoList.list.reduce((a, item) => {
                        if (item.orderId === '' && tags[tag] === item.tag && item.blockHeight !== -1) {
                            const utxoAmount = item.mrc20s.reduce((acc, b) => {
                                mrc20s.push({
                                    ...b,
                                    satoshi: item.satoshi,
                                    satoshis: item.satoshis,
                                })
                                return acc + Number(b.amount)
                            }, 0);
                            return a + utxoAmount
                        }
                        return a
                    }, 0)
                    const unconfirmedBal = utxoList.list.reduce((a, item) => {
                        if (item.orderId === '' && tags[tag] === item.tag && item.blockHeight === -1) {
                            const utxoAmount = item.mrc20s.reduce((acc, b) => {
                                return acc + Number(b.amount)
                            }, 0);
                            return a + utxoAmount
                        }
                        return a
                    }, 0)
                    const listedBal = utxoList.list.reduce((a, item) => {
                        if (item.orderId !== '' && tags[tag] === item.tag) {
                            const utxoAmount = item.mrc20s.reduce((acc, b) => {
                                return acc + Number(b.amount)
                            }, 0);
                            return a + utxoAmount
                        }
                        return a
                    }, 0)

                    _list[i].avlBalance = avlBal.toFixed(Number(_list[i].decimals))
                    _list[i].unconfirmedBalance = unconfirmedBal.toFixed(Number(_list[i].decimals))
                    _list[i].listedBalance = listedBal.toFixed(Number(_list[i].decimals))
                    _list[i].mrc20s = mrc20s
                    _list[i].tickInfo = _tickInfo && _tickInfo.data
                }
            }
            setList(_list.filter((item) => item.tag === tags[tag]));
        } catch (err) {
            console.error('fetchList error:', err);
        }
        setLoading(false)
    }, [dogeAddress, network, tag, tick, dogeAuthParams])

    useEffect(() => {
        fetchList()
    }, [fetchList])

    const handleCheck = (mrc20Id: string) => {
        if (checkList.includes(mrc20Id)) {
            setCheckList(checkList.filter((item) => item !== mrc20Id));
        } else {
            setCheckList([...checkList, mrc20Id]);
        }
    };

    const onInputChange = (mrc20Id: string, value: number | null) => {
        setSellPrices((prev) => ({
            ...prev,
            [mrc20Id]: value || 0,
        }));
    };

    const onAmountInputChange = (mrc20Id: string, value: number | null) => {
        setSellAmounts((prev) => ({
            ...prev,
            [mrc20Id]: value || 0,
        }));
    };

    const totalStas = useMemo(() => {
        const total = checkList.reduce((a, b) => {
            return a + (sellPrices[b] || 0) * (sellAmounts[b] || 0);
        }, 0);
        return total;
    }, [checkList, sellPrices, sellAmounts]);

    const listItem = async (mrc20Id: string, price: number, amount: number) => {
        if (!dogeAddress) return
        const mrc20 = list.find((item) => item.mrc20Id === mrc20Id);
        if (!mrc20 || !mrc20.mrc20s) return;
        
        // 找到匹配数量的 UTXO
        const findMrc20 = mrc20.mrc20s.find((item) => Number(item.amount) === amount);
        if (!findMrc20) {
            throw new Error(formatMessage('No matching UTXO found. Doge MRC-20 does not support splitting amounts yet.'));
        }

        const [txId, voutStr] = findMrc20.txPoint.split(':');
        const utxo: API.UTXO = {
            txId,
            satoshi: findMrc20.satoshi || 1000000,
            satoshis: findMrc20.satoshis || 1000000,
            vout: Number(voutStr),
            outputIndex: Number(voutStr),
            confirmed: true
        }

        // 价格转换为 satoshis (DOGE)
        const priceInSats = Number(new Decimal(price).times(DOGE_SATS_PER_COIN).toFixed(0));

        // 创建上架 PSBT
        const psbtRaw = await listDogeMrc20Order(utxo, priceInSats, network, dogeAddress);
        
        // 提交到服务器
        const { code, message: msg } = await sellMRC20Order(network, { 
            assetType: 'mrc20', 
            tickId: mrc20Id, 
            address: dogeAddress, 
            psbtRaw,
            source: getDogeSource(),
            chain: 'doge'
        }, {
            headers: {
                ...dogeAuthParams,
            },
        })
        if (code !== 0) {
            throw new Error(msg)
        }
    }

    const handleSale = async () => {
        if (checkList.length === 0) return;
        for (let i = 0; i < checkList.length; i++) {
            const order = list.find((item) => item.mrc20Id === checkList[i]);
            if (!sellPrices[checkList[i]]) {
                message.error(`The listing price for ${order!.tick} has not been set.`);
                return;
            }
            if (!sellAmounts[checkList[i]] || Number(sellAmounts[checkList[i]]) === 0) {
                message.error(`The listing quantity for ${order!.tick} has not been set.`);
                return;
            }
        }
        setSubmiting(true)
        for (let i = 0; i < checkList.length; i++) {
            const order = list.find((item) => item.mrc20Id === checkList[i]);
            if (!order) continue
            try {
                await listItem(order.mrc20Id, sellPrices[checkList[i]] * sellAmounts[checkList[i]], sellAmounts[checkList[i]]);
            } catch (err: any) {
                console.log(err);
                message.error(`${order!.tick}: ${err.message}`);
                await fetchList();
                setSubmiting(false)
                return;
            }
        }
        setSuccessProp({
            show: true,
            onClose: () => setSuccessProp(DefaultSuccessProps),
            onDown: () => setSuccessProp(DefaultSuccessProps),
            title: <Trans>List For Sale</Trans>,
            tip: <Trans>Successful</Trans>,
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
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 4 }}
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
                                    <Item info={{ tick: item.tick, mrc20Id: item.mrc20Id, metaData: '', tag: tags[tag], ...item.tickInfo }} />
                                </div>
                                <div className="tickAmount" >
                                    <Descriptions labelStyle={{ color: '#FFFFFF', display: 'flex', alignItems: 'center' }}
                                        contentStyle={{ flexGrow: 1, justifyContent: 'flex-end', color: 'rgba(255, 255, 255, 0.5)', whiteSpace: 'nowrap' }}
                                        column={1} items={
                                            [
                                                {
                                                    key: '1',
                                                    label: <Trans>Available</Trans>,
                                                    children: <NumberFormat value={item.avlBalance} precision={item.decimals} suffix={` ${item.tick}`} />
                                                },
                                                {
                                                    key: '2',
                                                    label: <Trans>Listed</Trans>,
                                                    children: <NumberFormat value={item.listedBalance} precision={item.decimals} suffix={` ${item.tick}`} />
                                                },
                                                {
                                                    key: '3',
                                                    label: <Trans>Unconfirmed</Trans>,
                                                    children: <NumberFormat value={item.unconfirmedBalance} precision={item.decimals} suffix={` ${item.tick}`} />
                                                },
                                            ]
                                        } />
                                </div>
                            </div>
                            <div className="inputGroup">
                                <div className="inputWrap">
                                    <div className="label">
                                        <Trans>Quantity</Trans>
                                    </div>
                                    <InputNumber
                                        onChange={(value) => onAmountInputChange(item.mrc20Id, value)}
                                        controls={false}
                                        className="input"
                                        value={sellAmounts[item.mrc20Id]}
                                        precision={Number(item.decimals)}
                                        placeholder={formatMessage('Quantity')}
                                        disabled={Number(item.avlBalance) === 0}
                                        max={item.avlBalance}
                                        min={0}
                                        onFocus={() => {
                                            !checkList.includes(item.mrc20Id) && handleCheck(item.mrc20Id);
                                        }}
                                    />
                                </div>

                                <div className="inputWrap">
                                    <div className="label">
                                        <Trans>Per Price</Trans>
                                    </div>
                                    <InputNumber
                                        onChange={(value) => onInputChange(item.mrc20Id, value)}
                                        controls={false}
                                        className="input"
                                        value={sellPrices[item.mrc20Id]}
                                        suffix={<>DOGE </>}
                                        placeholder={formatMessage('Per Price')}
                                        disabled={Number(item.avlBalance) === 0}
                                        onFocus={() => {
                                            !checkList.includes(item.mrc20Id) && handleCheck(item.mrc20Id);
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="inputGroup">
                                <div className="inputWrap">
                                    <div className="label">
                                        <Trans>Total Price</Trans>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', width: '100%', border: '1px solid #3A3A3A', padding: '8px', borderRadius: 8, boxSizing: 'border-box' }}>
                                        <ChainIcon chain="doge" size={32} />
                                        <div>
                                            <NumberFormat value={(sellPrices[item.mrc20Id] || 0) * (sellAmounts[item.mrc20Id] || 0)} suffix=" DOGE" /> <USDPrice value={(sellPrices[item.mrc20Id] || 0) * (sellAmounts[item.mrc20Id] || 0)} chain="doge" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </List.Item>
            )}
        />
        <div className="totalPrice">
            <div className="label"><Trans>Total Price</Trans></div>
            <div className="aciotns">
                <div className="prices">
                    <div className="sats"><NumberFormat value={totalStas} suffix=" DOGE" /> <USDPrice value={totalStas} decimals={0} chain="doge" /> </div>
                </div>
                {connected ? (
                    <Button
                        type="primary"
                        disabled={totalStas === 0}
                        onClick={handleSale}
                        loading={submiting}
                    >
                        <Trans>List For Sale</Trans>
                    </Button>
                ) : (
                    <Button type="primary" onClick={connect}>
                        <Trans>Connect Wallet</Trans>
                    </Button>
                )}
            </div>
        </div>
        <SuccessModal {...successProp}></SuccessModal>
    </>
}

export default memo(ListForDogeMRC20)

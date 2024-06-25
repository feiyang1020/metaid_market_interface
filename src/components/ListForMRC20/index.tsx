import { useModel } from "umi"
import usePageList from "@/hooks/usePageList"
import { getMrc20AddressUtxo, getUserMrc20List, sellMRC20Order } from "@/services/api"
import { useEffect, memo, useState, useCallback, useMemo } from "react"
import { Button, Card, ConfigProvider, InputNumber, List, message } from "antd"
import { CheckOutlined } from "@ant-design/icons"
import { formatSat } from "@/utils/utlis"
import { listMrc20Order } from "@/utils/mrc20"
import SuccessModal, { DefaultSuccessProps, SuccessProps } from "../SuccessModal"

const ListForMRC20 = () => {
    const { btcAddress, connect, connected, network, authParams } =
        useModel("wallet");
    const [list, setList] = useState<API.MRC20Info[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [successProp, setSuccessProp] =
        useState<SuccessProps>(DefaultSuccessProps);


    const [checkList, setCheckList] = useState<string[]>([]);
    const [sellPrices, setSellPrices] = useState<Record<string, number>>({});
    const [submiting, setSubmiting] = useState<boolean>(false);
    const fetchList = useCallback(async () => {
        if (!btcAddress) return;
        setLoading(true);
        const { data } = await getUserMrc20List(network, { address: btcAddress, cursor: 0, size: 50 });
        const _list = []
        if (data && data.list && data.list.length > 0) {
            for (let i = 0; i < data.list.length; i++) {
                const { data: utxoList, code } = await getMrc20AddressUtxo(network, { address: btcAddress, tickId: data.list[i].mrc20Id, cursor: 0, size: 100 }, {
                    headers: {
                        ...authParams,
                    },
                });
                if (code !== 0) { continue }

                utxoList.list.forEach((item) => {
                    if (item.orderId === '') {
                        item.mrc20s.forEach((mrc20) => {

                            _list.push({
                                ...item,
                                ...mrc20,
                            })
                        });
                    }

                })
            }
        }
        setList(_list);
        setLoading(false)


    }, [btcAddress, network])
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


    const totalStas = useMemo(() => {
        const total = checkList.reduce((a, b) => {
            return a + sellPrices[b] || 0;
        }, 0);
        return total;
    }, [checkList, sellPrices]);

    const listItem = async (txPoint: string, mrc20Id: string, price: number) => {
        if (!btcAddress) return
        const utxo: API.UTXO = {
            txId: txPoint.split(':')[0],
            satoshi: 546,
            satoshis: 546,
            vout: Number(txPoint.split(':')[1]),
            outputIndex: Number(txPoint.split(':')[1]),
            confirmed: true
        }
        const psbtRaw = await listMrc20Order(utxo, price, network, btcAddress);
        console.log('psbtRaw', psbtRaw)
        const { code, message } = await sellMRC20Order(network, { assetType: 'mrc20', tickId: mrc20Id, address: btcAddress, psbtRaw }, {
            headers: {
                ...authParams,
            },
        })
        if (code !== 0) {
            throw new Error(message)
        }
    }

    const handleSale = async () => {
        if (checkList.length === 0) return;
        for (let i = 0; i < checkList.length; i++) {
            if (!sellPrices[checkList[i]]) {
                const order = list.find((item) => item.txPoint === checkList[i]);
                message.error(`${order!.amount} ${order!.tick} No price set yet`);
                return;
            }
        }
        setSubmiting(true)
        for (let i = 0; i < checkList.length; i++) {
            const order = list.find((item) => item.txPoint === checkList[i]);
            if (!order) continue
            try {
                await listItem(order.txPoint, order.mrc20Id, sellPrices[checkList[i]]);
            } catch (err: any) {
                console.log(err);
                message.error(`${order!.amount} ${order!.tick}: ${err.message}`);
                await fetchList();
                setSubmiting(false)
                return;
            }
        }
        setSuccessProp({
            show: true,
            onClose: () => setSuccessProp(DefaultSuccessProps),
            onDown: () => setSuccessProp(DefaultSuccessProps),
            title: "List for sale",
            tip: "Successful",
            children: <div className="saleSuccess"></div>,
        });
        setSellPrices({});
        setCheckList([]);
        setSubmiting(false)
        await fetchList();
    };

    return <>
        <List
            className="listWrap"
            loading={loading}
            grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 6 }}
            dataSource={list}
            rowKey={"txPoint"}
            renderItem={(item) => (
                <List.Item>
                    <Card
                        styles={{ body: { padding: 0 } }}
                        className={
                            checkList.includes(item.txPoint)
                                ? "sellCard checked"
                                : "sellCard"
                        }
                    >
                        <div className="cardWrap">
                            <div
                                className="contetn"
                                onClick={() => {
                                    handleCheck(item.txPoint);
                                }}
                            >

                                <div className="assetNumber">
                                    <ConfigProvider
                                        theme={{
                                            components: {
                                                Button: {
                                                    colorTextLightSolid: "#fff",
                                                    primaryColor: "#fff",
                                                    colorPrimary: `rgba(51, 51, 51, 0.38)`,
                                                    colorPrimaryHover: `rgba(51, 51, 51, 0.38)`,
                                                    colorPrimaryActive: `rgba(51, 51, 51, 0.38)`,
                                                    lineWidth: 0,
                                                    primaryShadow: "0 0px 0 rgba(0, 0, 0, 0)",
                                                },
                                            },
                                        }}
                                    >
                                        <Button type="primary">#{item.tick}</Button>
                                    </ConfigProvider>
                                </div>
                                <div className="checkBox">
                                    {checkList.includes(item.txPoint) ? (
                                        <div className="checked">
                                            <CheckOutlined />
                                        </div>
                                    ) : (
                                        <div className="unchecked"></div>
                                    )}
                                </div>
                                <div>{item.amount} {item.tick}</div>
                            </div>

                            <div className="desc">
                                <div>
                                    <div className="number">#{item.tick}</div>

                                </div>

                            </div>

                            <div className="inputWrap">
                                <InputNumber
                                    onChange={(value) => onInputChange(item.txPoint, value)}
                                    controls={false}
                                    className="input"
                                    value={sellPrices[item.txPoint]}
                                    suffix="sats"

                                    onFocus={() => {
                                        handleCheck(item.txPoint);
                                    }}
                                />
                            </div>
                            <div className="btcAmount">
                                {formatSat(sellPrices[item.txPoint] || 0)} BTC
                            </div>
                        </div>
                    </Card>
                </List.Item>
            )}
        />
        <div className="totalPrice">
            <div className="label">Total Price</div>
            <div className="aciotns">
                <div className="prices">
                    <div className="sats">{totalStas}sats</div>
                    <div className="btc">{formatSat(totalStas)}BTC</div>
                </div>
                {connected ? (
                    <Button
                        type="primary"
                        disabled={totalStas === 0}
                        onClick={handleSale}
                        loading={submiting}
                    >
                        List for sale
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
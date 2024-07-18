import Order from "@/components/Order";
import { getIdCoinInfo, getMrc20AddressUtxo, sellMRC20Order, sellOrder } from "@/services/api";
import { buildAskLimit } from "@/utils/orders";
import { Button, Card, ConfigProvider, InputNumber, List, Space, Typography, message } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useModel, useMatch } from "umi";
import "./index.less";
import level from "@/assets/level.svg";
import {
    ArrowLeftOutlined,
    CheckOutlined,
    LeftOutlined,
    LoadingOutlined,
} from "@ant-design/icons";
import { formatSat } from "@/utils/utlis";
import SuccessModal, {
    DefaultSuccessProps,
    SuccessProps,
} from "@/components/SuccessModal";
import JSONView from "@/components/JSONView";
import ListForMRC20 from "@/components/ListForMRC20";
import useIntervalAsync from "@/hooks/useIntervalAsync";
import MetaIdAvatar from "@/components/MetaIdAvatar";
import NumberFormat from "@/components/NumberFormat";
import { listMrc20Order } from "@/utils/mrc20";
import MRC20Icon from "@/components/MRC20Icon";
import Decimal from "decimal.js";
const items = ["PIN", 'MRC-20', 'ID-Coins'];
export default () => {
    const { btcAddress, connect, connected, network, authParams } =
        useModel("wallet");
    const match = useMatch('/list/idCoins/:tick');
    const [idCoin, setIdCoin] = useState<API.IdCoin>();
    const [showListBtn, setShowListBtn] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [list, setList] = useState<API.MRC20Info[]>([]);

    const [successProp, setSuccessProp] =
        useState<SuccessProps>(DefaultSuccessProps);


    const [checkList, setCheckList] = useState<string[]>([]);
    const [sellPrices, setSellPrices] = useState<Record<string, number>>({});
    const [submiting, setSubmiting] = useState<boolean>(false);
    const fetchData = useCallback(async () => {
        if (!match || !match.params.tick) return;
        const params: any = {};
        params.tick = match.params.tick
        const { data } = await getIdCoinInfo(network, params);
        setIdCoin(data);
    }, [match, network])
    const fetchUserUtxo = useCallback(async () => {
        try {
            if (!idCoin || !btcAddress) throw new Error('no idCoin or btcAddress')
            const { data: utxoList, code } = await getMrc20AddressUtxo(network, { address: btcAddress, tickId: idCoin.mrc20Id, cursor: 0, size: 100 }, {
                headers: {
                    ...authParams,
                },
            });
            const _list: any = []
            if (code === 0) {
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
            setList(_list);
            setLoading(false)
        } catch (err) {

        }
        setLoading(false)

    }, [
        btcAddress,
        network,
        authParams,
        idCoin
    ])

    const balance = useMemo(() => {
        if (!list) return 0
        return list.reduce((prev, curr) => {
            return prev + Number(curr.amount)
        }, 0)
    }, [list])

    useEffect(() => { fetchUserUtxo() }, [fetchUserUtxo])
    const update = useIntervalAsync(fetchData, 100000)

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
        const psbtRaw = await listMrc20Order(utxo, Number(new Decimal(price).times(1e8).toFixed(0)), network, btcAddress);
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
                await fetchUserUtxo();
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
        await fetchUserUtxo();
    };
    return (
        <div className="listIdCoinPage animation-slide-bottom">
            <div
                className="title"
                onClick={() => {
                    history.back();
                }}
            >
                <LeftOutlined /> List for sale
            </div>
            <div className="saleContent">
                <div className="idCoins">
                    {idCoin && <div className="idInfo">
                        <div className="info">
                            <MetaIdAvatar avatar={idCoin.deployerUserInfo.avatar} size={59} style={{minWidth:59}} />
                            <div>
                                <Typography.Title level={5} style={{ margin: 0 }}>
                                    {idCoin.tick}
                                </Typography.Title>
                                <Typography.Text copyable={{ text: idCoin.deployerMetaId }} className="metaid"> MetaID: {idCoin.deployerMetaId.replace(/(\w{6})\w+(\w{5})/, "$1...")}</Typography.Text>
                            </div>
                            <div className="count">
                                <div>
                                    <NumberFormat value={loading ? '--' : balance} suffix={` ${idCoin.tick}`} />
                                </div>
                                <Typography.Text className="metaid">Total Quantity</Typography.Text>
                            </div>
                        </div>
                    </div>}



                </div>

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


                                        <div className="checkBox">
                                            {checkList.includes(item.txPoint) ? (
                                                <div className="checked">
                                                    <CheckOutlined />
                                                </div>
                                            ) : (
                                                <div className="unchecked"></div>
                                            )}
                                        </div>
                                        <div className="info"><MRC20Icon size={32} tick={item.tick} metadata={item.metaData} /> {item.amount} {item.tick}</div>
                                    </div>



                                    <div className="inputWrap">
                                        <InputNumber
                                            onChange={(value) => onInputChange(item.txPoint, value)}
                                            controls={false}
                                            className="input"
                                            value={sellPrices[item.txPoint]}
                                            suffix="BTC"
                                            min={0.00002}
                                            onFocus={() => {
                                                handleCheck(item.txPoint);
                                            }}
                                        />
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
                            <div className="sats"><NumberFormat value={totalStas} suffix=" BTC" /></div>
                            {/* <div className="btc">{formatSat(totalStas)}BTC</div> */}
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
            </div>



        </div>
    );
};

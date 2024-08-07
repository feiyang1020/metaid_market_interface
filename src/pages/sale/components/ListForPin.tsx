import { useModel } from "umi";
import JSONView from "@/components/JSONView";
import NumberFormat from "@/components/NumberFormat";
import SuccessModal, { DefaultSuccessProps, SuccessProps } from "@/components/SuccessModal";
import useIntervalAsync from "@/hooks/useIntervalAsync";
import { getAssets, getContent, sellOrder } from "@/services/api";
import { buildAskLimit } from "@/utils/orders";
import { CheckOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button, Card, ConfigProvider, InputNumber, List, message } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import level from "@/assets/level.svg";
import PinContent from "./PinContent";

export default () => {
    const size = 50;
    const { network, btcAddress, connected, authParams, connect } = useModel("wallet");
    const [sortKey, setSortKey] = useState<string>("timestamp");
    const [sortType, setSortType] = useState<number>(-1);
    const [cursor, setCursor] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);
    const [orders, setOrders] = useState<API.Asset[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const fetchOrders = useCallback(
        async (retry: boolean = true) => {
            if (!connected || !authParams) {
                setOrders([]);
                setTotal(0);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const ret = await getAssets(
                    network,
                    {
                        assetType: "pins",
                        address: btcAddress,
                        cursor,
                        size,
                    },
                    {
                        headers: {
                            ...authParams,
                        },
                    }
                );
                const list: API.Asset[] = ret.data.list
                    .filter((item) => item.orderId === "")
                    .map((item) => {
                        return {
                            ...item,
                            info: JSON.parse(item.detail),
                        };
                    });
                // for (let i = 0; i < list.length; i++) {
                //     if (
                //         list[i].info &&
                //         list[i].info.contentTypeDetect.indexOf("text") > -1
                //     ) {
                //         const cont = await getContent(list[i].content);
                //         list[i].textContent =
                //             typeof cont === "object" ? cont : cont;
                //     }
                // }
                setOrders(list);
                setTotal(ret.data.total);
                setLoading(false);
            } catch (err: any) {
                console.log(err);
                if (
                    err.message === "Request failed with status code 500" &&
                    retry === true
                ) {
                    fetchOrders(false);
                }
            }

            setLoading(false);
        },
        [network, sortKey, sortType, cursor, btcAddress, connected]
    );
    const updateOrders: any = useIntervalAsync(fetchOrders, 90000);
    const [sellPrices, setSellPrices] = useState<Record<string, number>>({});
    const [checkList, setCheckList] = useState<string[]>([]);
    const [submiting, setSubmiting] = useState<boolean>(false);
    const [successProp, setSuccessProp] =
        useState<SuccessProps>(DefaultSuccessProps);
    const onInputChange = (assetId: string, amount: number) => {
        setSellPrices((prev) => {
            return {
                ...prev,
                [assetId]: amount,
            };
        });
    };
    const handleCheck = (assetId: string) => {
        if (checkList.includes(assetId)) {
            setCheckList(checkList.filter((item) => item !== assetId));
        } else {
            setCheckList([...checkList, assetId]);
        }
    };



    const totalStas = useMemo(() => {
        const total = checkList.reduce((a, b) => {
            return a + sellPrices[b] || 0;
        }, 0);
        return total;
    }, [checkList, sellPrices]);
    const listOrder = async (utxoId: string, assetId: string, price: number) => {
        if (!btcAddress || !network) return;
        const ret = await buildAskLimit({
            total: Number(price * 1e8),
            utxoId,
            network,
        });
        const res = await sellOrder(
            network,
            {
                assetId,
                assetType: "pins",
                address: btcAddress,
                psbtRaw: ret,
            },
            {
                headers: {
                    ...authParams,
                },
            }
        );
        if (res.code !== 0) {
            throw new Error(res.message);
        }
    };

    const handleSale = async () => {
        if (checkList.length === 0) return;
        for (let i = 0; i < checkList.length; i++) {
            if (!sellPrices[checkList[i]]) {
                const order = orders.find((item) => item.assetId === checkList[i]);
                message.error(`#${order?.assetNumber} No price set yet`);
                return;
            }
        }
        setSubmiting(true)
        for (let i = 0; i < checkList.length; i++) {
            const order = orders.find((item) => item.assetId === checkList[i]);
            try {
                if (!order) throw new Error("utxoId not found");
                await listOrder(order.utxoId, checkList[i], sellPrices[checkList[i]]);
            } catch (err: any) {
                console.log(err);
                message.error(`#${order?.assetNumber}: ${err.message}`);
                await updateOrders();
                setSubmiting(false)
                return;
            }
        }
        setSubmiting(false)
        setSuccessProp({
            show: true,
            onClose: () => setSuccessProp(DefaultSuccessProps),
            onDown: () => setSuccessProp(DefaultSuccessProps),
            title: "List For Sale",
            tip: "Successful",
            children: <div className="saleSuccess"></div>,
        });
        setSellPrices({});
        setCheckList([]);
        await updateOrders();
    };
    return <> <List
        className="listWrap"
        loading={loading}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 6 }}
        dataSource={orders}
        rowKey={"assetId"}
        pagination={{
            position: "bottom",
            align: "center",
            pageSize: 12,
            total: orders.length,

        }}
        renderItem={(item) => (
            <List.Item>
                <Card
                    styles={{ body: { padding: 0 } }}
                    className={
                        checkList.includes(item.assetId)
                            ? "sellCard checked"
                            : "sellCard"
                    }
                >
                    <div className="cardWrap">
                        <div
                            className="contetn"
                            onClick={() => {
                                item.pinStatus === 0 && handleCheck(item.assetId);
                            }}
                        >
                            <PinContent asset={item} />
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
                                    <Button type="primary">#{item.assetNumber}</Button>
                                </ConfigProvider>
                            </div>
                            <div className="checkBox">
                                {checkList.includes(item.assetId) ? (
                                    <div className="checked">
                                        <CheckOutlined />
                                    </div>
                                ) : (
                                    <div className="unchecked"></div>
                                )}
                            </div>
                        </div>

                        <div className="desc">
                            <div>
                                <div className="number">#{item.assetNumber}</div>
                                <div className="path">
                                    {item.info && (item.info.pinPath || item.info.path)}
                                </div>
                            </div>
                            <div className="levelInfo">
                                <div className="level">
                                    {item.assetLevel !== "--" && item.assetPop !== "--" ? (
                                        <>
                                            <img src={level} alt="" />
                                            {item.assetLevel}
                                        </>
                                    ) : (
                                        <span>--</span>
                                    )}
                                </div>
                                {item.pinStatus === -9 && (
                                    <div className="pinStatus">
                                        Pending{" "}
                                        <LoadingOutlined
                                            style={{ fontSize: 14, color: "#FF8F1F" }}
                                            spin
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="inputWrap">
                            <InputNumber
                                onChange={(value) => onInputChange(item.assetId, value)}
                                controls={false}
                                className="input"
                                value={sellPrices[item.assetId]}
                                suffix="BTC"
                                disabled={item.pinStatus !== 0}
                                onFocus={() => {
                                    !checkList.includes(item.assetId) && handleCheck(item.assetId);
                                }}
                            />
                        </div>
                        {/* <div className="btcAmount">
              {formatSat(sellPrices[item.assetId] || 0)} {" "} BTC
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
import { useModel } from "umi";
import { getMrc20OrderPsbt, getMrc20Orders } from "@/services/api";
import { useCallback, useEffect, useState } from "react";
import { Avatar, Button, Card, ConfigProvider, Divider, List, Tooltip } from "antd";
import MetaIdAvatar from "@/components/MetaIdAvatar";
import btc from "@/assets/logo_btc@2x.png";
import { formatSat } from "@/utils/utlis";
import "./index.less";
import { buildBuyMrc20TakePsbt } from "@/utils/mrc20";
import BuyMrc20Modal from "@/components/BuyMrc20Modal";
import NumberFormat from "@/components/NumberFormat";
import MRC20Icon from "@/components/MRC20Icon";
export default ({ mrc20Id }: { mrc20Id: string }) => {
    const { network, connected, connect, btcAddress, authParams } = useModel('wallet')
    const [list, setList] = useState<API.Mrc20Order[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [curOrder, setCurOrder] = useState<API.Mrc20Order>();
    const [page, setPage] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);
    const [size, setSize] = useState<number>(12);
    const [buyModalVisible, setBuyModalVisible] = useState<boolean>(false);
    const fetchOrders = useCallback(async () => {
        console.log('fetchOrders', network, mrc20Id, page, size)
        if (!mrc20Id) return;
        setLoading(true);

        const { data } = await getMrc20Orders(network, { assetType: 'mrc20', orderState: 1, sortKey: 'priceAmount', sortType: -1, tickId: mrc20Id, cursor: page * size, size });
        if (data.list) {
            setList(data.list)
            setTotal(data.total);
        }else{
            setList([])
            setTotal(0)
        }
        setLoading(false);
    }, [mrc20Id, network])
    useEffect(() => { fetchOrders() }, [fetchOrders]);
    const handleBuy = async (order: API.Mrc20Order) => {
        if (!btcAddress || !authParams) return
        try {
            const { data, code, message } = await getMrc20OrderPsbt(
                network,
                {
                    orderId: order.orderId,
                    buyerAddress: btcAddress,
                },
                {
                    headers: {
                        ...authParams,
                    },
                }
            );
            if (code !== 0) {
                throw new Error(message)
            }
            // await buildBuyMrc20TakePsbt(network, order.orderId, btcAddress)
        } catch (e) {
            console.log(e)
        }
    }
    return <div>
        <div className="list">
            <List
                loading={loading}
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }}
                dataSource={list}
                renderItem={(item) => (
                    <List.Item>
                        <Card styles={{ body: { padding: 0 } }} hoverable className="orderCard mrc20OrderCard">
                            <div className="cardWrap">

                                <div
                                    className="contetn"

                                >
                                    <div className="textContent">
                                        <div className="amont">
                                           <MRC20Icon size={32} metadata={item.metaData} tick={item.tick}/>  {item.amount} {item.tick}
                                        </div>
                                        <div className="units">

                                            <span className="colorPrimary">
                                                <NumberFormat value={item.priceAmount / item.amount} />
                                            </span> sats/{item.tick}
                                        </div>


                                    </div>
                                </div>


                                <div className="mrc20info">
                                    <div className="token">
                                        <div className="tokenName">
                                            #{item.tick}
                                        </div>
                                        <div className="tokenId">
                                            TokenID: {item.tickId.replace(/(\w{4})\w+(\w{5})/, "$1...$2")}
                                        </div>
                                    </div>
                                    <div className="sellerWrap">
                                        <div className="seller">

                                            <MetaIdAvatar
                                                avatar={item.seller.avatar}
                                                size={20}
                                                style={{ minWidth: 20 }}
                                            />
                                            <div className="name">{item.seller.name||item.sellerAddress.replace(/(\w{5})\w+(\w{5})/, "$1...")}</div>
                                        </div>
                                        <div className="tokenId">
                                            <Tooltip title={item.sellerMetaId}>
                                                MetaID : {item.sellerMetaId.replace(/(\w{5})\w+(\w{5})/, "$1...")}
                                            </Tooltip>

                                        </div>
                                    </div>

                                </div>


                                <div className="price ">
                                    <img src={btc} className="btcLogo" alt="" />{" "}
                                    <span>{formatSat(item.priceAmount)} BTC</span>
                                </div>

                                <div className="btn animation-slide-bottom">
                                    {connected ? (
                                        <Button
                                            type="primary"
                                            style={{ height: 40 }}
                                            block
                                            onClick={() => {
                                                setCurOrder(item);
                                                setBuyModalVisible(true);
                                            }}
                                        >
                                            Buy
                                        </Button>
                                    ) : (
                                        <Button
                                            type="primary"
                                            style={{ height: 40 }}
                                            block
                                            onClick={connect}
                                        >
                                            Connect Wallet
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </List.Item>
                )}
                rowKey={"orderId"}
                pagination={{
                    onChange: (page) => {
                        setLoading(true);
                        setPage(page - 1);
                    },
                    position: "bottom",
                    align: "center",
                    pageSize: 12,
                    total: total,
                    current: page + 1,
                }}
            />
        </div>
        <BuyMrc20Modal
            order={curOrder}
            show={buyModalVisible}
            onClose={() => {

                setBuyModalVisible(false);
                setCurOrder(undefined);
                fetchOrders()
            }}
        />
    </div>
}
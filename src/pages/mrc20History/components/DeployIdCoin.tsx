import { ArrowLeftOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Space, Table, TableProps, Tooltip, message } from "antd";
import { history, useModel,Link } from "umi";
import dayjs from "dayjs";
import { formatSat } from "@/utils/utlis";
import { useCallback, useEffect, useMemo, useState } from "react";
import Popup from "@/components/ResponPopup";
import { authTest, cancelMRC20Order, cancelOrder, getIdCoinInscribeOrders, getMrc20InscribeOrders, getMrc20Orders } from "@/services/api";
import JSONView from "@/components/JSONView";
import NumberFormat from "@/components/NumberFormat";
import Item from "@/components/Mrc20List/Item";
export default () => {
    const { btcAddress, network, authParams } = useModel("wallet");
    const [show, setShow] = useState<boolean>(false);

    const [submiting, setSubmiting] = useState<boolean>(false);
    const [list, setList] = useState<API.Mrc20InscribeOrder[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);
    const [size, setSize] = useState<number>(12);

    const fetchOrders = useCallback(async () => {
        if (!btcAddress||!authParams) return;
        setLoading(true);
        const { data } = await getIdCoinInscribeOrders(network, { opOrderType: 'deploy', address: btcAddress, cursor: page * size, size }, {
            headers: {
                ...authParams,
            },
        });
        if (data.list) {
            setList(data.list.map((item) => {
                if (item.pinCheck) {
                    try {
                        item.pinCheck = JSON.parse(item.pinCheck)
                    } catch (e) { item.pinCheck = {} }

                };
                return item
            }))
            setTotal(data.total);
        }
        setLoading(false);
    }, [network, btcAddress, page, size,authParams])
    useEffect(() => { fetchOrders() }, [fetchOrders]);

    const columns: TableProps<API.Mrc20InscribeOrder>["columns"] = [
        {
            title: 'Ticker',
            dataIndex: 'tick',
            width: 220,
            render: (_, record) => <Item info={{ tick: record.tick, mrc20Id: record.tickId, metaData: record.metaData }} />
        },

        // {
        //     title: 'Path',
        //     dataIndex: 'pinCheck',
        //     render: (price, record) => {
        //         return <Tooltip title={record.pinCheck.path}>path:{record.pinCheck.path && record.pinCheck.path.replace(/(.{5}).+(.{3})/, "$1...$2")}</Tooltip>
        //     }
        // },
        // {
        //     title: 'Difficulty Level',
        //     dataIndex: 'level',
        //     render: (item, record) => {
        //         return record.pinCheck.lvl || '--'
        //     }
        // },
        // {
        //     title: 'Count',
        //     dataIndex: 'count',
        //     render: (item, record) => {
        //         return record.pinCheck.count || '--'
        //     }
        // },
        {
            title: 'Followers Limit',
            dataIndex: 'followersLimit',

        },
        {
            title: 'Amount Per Mint',
            dataIndex: 'amtPerMint',

        },
        {
            title: 'Liquidity Per Mint',
            dataIndex: 'liquidityPerMint',
            render: (item) => {
                return <NumberFormat value={item} isBig decimal={8} suffix=' BTC' />
            }

        },
        {
            title: 'Holders',
            dataIndex: 'holders',
            align: 'center',
            render: (item, record) => {
                return <Link onClick={e=>e.stopPropagation()} style={{textDecoration:'underline',color:'#fff'}} to={`/holders/${record.tick}`}>{item}</Link>
            }

        },
        // {
        //     title: 'Decimals',
        //     dataIndex: 'decimals',

        // },
        // {
        //     title: 'Premine Count',
        //     dataIndex: 'premineCount',

        // },
        {
            title: 'Type',
            dataIndex: 'deployState',
            render: (item) => {
                return <>{item === 1 ? 'Confirmed' : <span style={{ color: '#FF5252' }}>{item === 0 ? 'Pending' : 'Failure'}</span>}</>
            }
        },
        {
            title: "Time",
            dataIndex: "timestamp",
            key: "timestamp",
            render: (text) => dayjs(text).format("YYYY/MM/DD,HH:mm"),
        },
        {
            title: "Hash",
            dataIndex: "txId",
            key: "txId",
            render: (text, record) => (
                <Tooltip title={text}>
                    <a
                        style={{ color: "#fff", textDecoration: "underline" }}
                        target="_blank"
                        href={
                            network === "testnet"
                                ? `https://mempool.space/testnet/tx/${text}`
                                : `https://mempool.space/tx/${text}`
                        }
                    >
                        {text.replace(/(\w{5})\w+(\w{5})/, "$2")}
                    </a>
                </Tooltip>
            ),
        },


    ];
    return (
        <>

            <div className="tableWrap">
                <Table
                    scroll={{ x: 1000 }}
                    rowKey={"txId"}
                    loading={loading}
                    columns={columns}
                    dataSource={list}

                    bordered
                    pagination={{
                        position: ['bottomCenter'],
                        pageSize: size,
                        current: page + 1,
                        total,
                        onChange: (page) => {

                            setLoading(true);
                            setPage(page - 1);
                        },
                    }}
                    onRow={(record) => {
                        return {
                            style: { cursor: 'pointer' },
                            onClick: () => {
                                history.push(`/idCoin/${record.tick}`)
                            },
                        }
                    }}
                />
            </div>


        </>
    );
};

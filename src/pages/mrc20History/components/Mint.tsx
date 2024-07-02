import { ArrowLeftOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Space, Table, TableProps, Tooltip, message } from "antd";
import { Link, useModel } from "umi";
import dayjs from "dayjs";
import { formatSat } from "@/utils/utlis";
import { useCallback, useEffect, useMemo, useState } from "react";
import Popup from "@/components/ResponPopup";
import { authTest, cancelMRC20Order, cancelOrder, getMrc20InscribeOrders, getMrc20Orders } from "@/services/api";
import JSONView from "@/components/JSONView";
import NumberFormat from "@/components/NumberFormat";
import Item from "@/components/Mrc20List/Item";
const items = ["PIN", 'MRC20'];
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
        if (!btcAddress) return;
        setLoading(true);
        const { data } = await getMrc20InscribeOrders(network, { opOrderType: 'mint', address: btcAddress, cursor: page * size, size });
        if (data.list) {
            setList(data.list.map((item) => {
                if (item.qual) {
                    try {
                        item.qual = JSON.parse(item.qual)
                    } catch (e) { item.qual = {} }

                };
                return item
            }))
            setTotal(data.total);
        }
        setLoading(false);
    }, [network, btcAddress])
    useEffect(() => { fetchOrders() }, [fetchOrders]);

    const columns: TableProps<API.Mrc20InscribeOrder>["columns"] = [
        {
            title: 'Name',
            dataIndex: 'tick',
            width: 220,
            render: (_, record) => <Item info={{ tick: record.tick, mrc20Id: record.tickId }}
            />
        },

        {
            title: 'Path',
            dataIndex: 'qual',
            width: 200,
            render: (price, record) => {
                return <Tooltip title={record.qual.path}>path:{record.qual.path && record.qual.path.replace(/(.{5}).+(.{3})/, "$1...$2")}</Tooltip>
            }
        },
        // {
        //     title: 'Difficulty Level',
        //     dataIndex: 'level',
        //     width: 200,
        //     render: (item, record) => {
        //         return record.qual.lvl || '--'
        //     }
        // },
        // {
        //     title: 'Count',
        //     dataIndex: 'count',
        //     width: 200,
        //     render: (item, record) => {
        //         return record.qual.count || '--'
        //     }
        // },
        // {
        //     title: 'Max mint Count',
        //     dataIndex: 'mintCount',
        //     width: 200,
        // },
        {
            title: 'Amount Per Mint',
            dataIndex: 'amtPerMint',
            width: 200,
        },
        // {
        //     title: 'Decimals',
        //     dataIndex: 'decimals',
        //     width: 200,
        // },
        // {
        //     title: 'Premine Count',
        //     dataIndex: 'premineCount',
        //     width: 200,
        // },
        {
            title: 'Type',
            dataIndex: 'blockHeight',
            width: 100,
            render: (item) => {
                return <>{item ? 'Confirmed' : <span style={{color:'#FF5252'}}>Pending</span>}</>
            }
        },
        {
            title: 'Pin',
            dataIndex: 'Pin',
            width: 200,
            render: (item, record) => {
                return <>{record.usedPins.map((item) => (<p>{item.replace(/(\w{5})\w+(\w{5})/, "$1...$2")}</p>))}</>
            }

        },

        {
            title: "Time",
            dataIndex: "timestamp",
            key: "timestamp",
            width: 200,
            render: (text) => dayjs(text).format("YYYY/MM/DD,HH:mm"),
        },
        {
            title: "Hash",
            dataIndex: "txId",
            key: "txId",
            width: 200,
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
                    scroll={{ x: 1200 }}
                    rowKey={"txId"}
                    loading={loading}
                    columns={columns}
                    dataSource={list}

                    bordered
                    pagination={{
                        pageSize: size,
                        current: page + 1,
                        total
                    }}

                />
            </div>


        </>
    );
};

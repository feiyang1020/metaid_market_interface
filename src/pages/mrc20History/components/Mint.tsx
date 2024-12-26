import { ArrowLeftOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Space, Table, TableProps, Tooltip, Grid } from "antd";
import { history, useModel } from "umi";
import dayjs from "dayjs";
import { formatSat } from "@/utils/utlis";
import { useCallback, useEffect, useMemo, useState } from "react";
import Popup from "@/components/ResponPopup";
import { authTest, cancelMRC20Order, cancelOrder, getMrc20InscribeOrders, getMrc20Orders } from "@/services/api";
import JSONView from "@/components/JSONView";
import NumberFormat from "@/components/NumberFormat";
import Item from "@/components/Mrc20List/Item";
import MetaIdAvatar from "@/components/MetaIdAvatar";
import PopLvl from "@/components/PopLvl";
import Trans from "@/components/Trans";
const { useBreakpoint } = Grid;
export default () => {
    const { btcAddress, network, authParams } = useModel("wallet");
    const [show, setShow] = useState<boolean>(false);
    const screens = useBreakpoint();
    const [submiting, setSubmiting] = useState<boolean>(false);
    const [list, setList] = useState<API.Mrc20InscribeOrder[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);
    const [size, setSize] = useState<number>(10);

    const fetchOrders = useCallback(async () => {
        if (!btcAddress) return;
        setLoading(true);
        const { data } = await getMrc20InscribeOrders(network, { opOrderType: 'mint', address: btcAddress, cursor: page * size, size });
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
    }, [network, btcAddress, page, size])
    useEffect(() => { fetchOrders() }, [fetchOrders]);

    const columns: TableProps<API.Mrc20InscribeOrder>["columns"] = [
        {
            title: <Trans>Ticker</Trans>,
            dataIndex: 'tick',
            width: 220,
            render: (_, record) => <Item info={{ tick: record.tick, mrc20Id: record.tickId, metaData: record.metaData }}
            />
        },
        {
            title: <Trans>Deployer</Trans>,
            dataIndex: 'deployer',
            width: 220,
            render: (_, record) => <div className="detail">
                <span className='avatars'><MetaIdAvatar size={20} avatar={record.deployerUserInfo.avatar} /> {record.deployerUserInfo.name || record.deployerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}</span>
                <span className='metaid'>MetaID : {record.deployerMetaId.replace(/(\w{6})\w+(\w{5})/, "$1...")}</span>
            </div>
        },

        {
            title: <Trans>Path</Trans>,
            dataIndex: 'pinCheck',
            width: 200,
            render: (price, record) => {
                return <Tooltip title={record.pinCheck.path}>path:{record.pinCheck.path && record.pinCheck.path.replace(/(.{5}).+(.{3})/, "$1...$2")}</Tooltip>
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
            title: <Trans>Amount Per Mint</Trans>,
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
            title: <Trans>Type</Trans>,
            dataIndex: 'mintState',
            width: 100,
            render: (item) => {
                return <>{item === 1 ? <Trans>Confirmed</Trans> : <span style={{ color: '#FF5252' }}><Trans>{item === 0 ? 'Pending' : 'Failure'}</Trans></span>}</>
            }
        },
        {
            title: <Trans>PIN</Trans>,
            dataIndex: 'Pin',
            width: 200,
            render: (item, record) => {
                return <>{record.usedPins.map((item) => (<p className="userPin">{item.replace(/(\w{5})\w+(\w{5})\-/, "$1...$2")} <PopLvl lvl={item.split('-')[1]}></PopLvl></p>))}</>
            }

        },

        {
            title: <Trans>Time</Trans>,
            dataIndex: "timestamp",
            key: "timestamp",
            width: 200,
            render: (text) => dayjs(text).format("YYYY/MM/DD,HH:mm"),
        },
        {
            title: <Trans>Hash</Trans>,
            dataIndex: "txId",
            key: "txId",
            width: 200,
            render: (text, record) => (
                <Tooltip title={text}>
                    <a
                        style={{ color: "#fff", textDecoration: "underline" }}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
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
    const getMinSort = () => {
        const TypeIndex = columns.findIndex(item => item.dataIndex === 'mintState');
        return [columns[0], columns[TypeIndex], ...columns.slice(1).filter(item => item.dataIndex !== 'mintState')]
    }
    return (
        <>

            <div className="tableWrap">
                <Table
                    scroll={{ x: 1200 }}
                    rowKey={"txId"}
                    loading={loading}
                    columns={screens.md ? columns : getMinSort()}
                    dataSource={list}

                    bordered
                    pagination={{
                        position: ['bottomCenter'],
                        pageSize: size,
                        current: page + 1,
                        total,
                        onChange: (page,pageSize) => {

                            setLoading(true);
                            setPage(page - 1);
                            setSize(pageSize || 10);
                        },
                    }}

                    onRow={(record) => {
                        return {
                            style: { cursor: 'pointer' },
                            onClick: () => {
                                history.push(`/mrc20/${record.tick}`)
                            },
                        }
                    }}

                />
            </div>


        </>
    );
};

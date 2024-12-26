
import { Table, TableProps, Tooltip, message, Grid } from "antd";
import { history, useModel, Link } from "umi";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { authTest, cancelMRC20Order, cancelOrder, getMrc20InscribeOrders, getMrc20Orders } from "@/services/api";
import Item from "@/components/Mrc20List/Item";
import Trans from "@/components/Trans";
const { useBreakpoint } = Grid;
export default () => {
    const { btcAddress, network, authParams } = useModel("wallet");
    const screens = useBreakpoint();
    const [list, setList] = useState<API.Mrc20InscribeOrder[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);
    const [size, setSize] = useState<number>(12);

    const fetchOrders = useCallback(async () => {
        if (!btcAddress) return;
        setLoading(true);
        const { data } = await getMrc20InscribeOrders(network, { opOrderType: 'deploy', address: btcAddress, cursor: page * size, size });
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
            render: (_, record) => <Item info={{ tick: record.tick, mrc20Id: record.tickId, metaData: record.metaData }} />
        },

        {
            title: <Trans>Path</Trans>,
            dataIndex: 'pinCheck',
            render: (price, record) => {
                return <Tooltip title={record.pinCheck.path}>path:{record.pinCheck.path && record.pinCheck.path.replace(/(.{5}).+(.{3})/, "$1...$2")}</Tooltip>
            }
        },
        {
            title: <Trans>Difficulty Level</Trans>,
            dataIndex: 'level',
            render: (item, record) => {
                return record.pinCheck.lvl || '--'
            }
        },
        {
            title: <Trans>Count</Trans>,
            dataIndex: 'count',
            render: (item, record) => {
                return record.pinCheck.count || '--'
            }
        },
        {
            title: <Trans>Mint Limit</Trans>,
            dataIndex: 'mintCount',

        },
        {
            title: <Trans>Amount Per Mint</Trans>,
            dataIndex: 'amtPerMint',

        },
        {
            title: <Trans>Decimals</Trans>,
            dataIndex: 'decimals',

        },
        {
            title: <Trans>Premine Count</Trans>,
            dataIndex: 'premineCount',

        },
        {
            title: <Trans>Holders</Trans>,
            dataIndex: 'holders',
            align: 'center',
            render: (item, record) => {
                return <Link onClick={e => e.stopPropagation()} style={{ textDecoration: 'underline', color: '#fff' }} to={`/holders/${record.tick}`}>{item}</Link>
            }

        },
        {
            title: <Trans>Type</Trans>,
            dataIndex: 'deployState',
            render: (item) => {
                return <>{item === 1 ? <Trans>Confirmed</Trans> : <span style={{ color: '#FF5252' }}><Trans>{item === 0 ? 'Pending' : 'Failure'}</Trans></span>}</>
            }
        },
        {
            title: <Trans>Time</Trans>,
            dataIndex: "timestamp",
            key: "timestamp",
            render: (text) => dayjs(text).format("YYYY/MM/DD,HH:mm"),
        },
        {
            title: <Trans>Hash</Trans>,
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

    const getMinSort = () => {
        const TypeIndex = columns.findIndex(item => item.dataIndex === 'deployState');
        return [columns[0], columns[TypeIndex], ...columns.slice(1).filter(item => item.dataIndex !== 'deployState')]
    }
    return (
        <>

            <div className="tableWrap">
                <Table
                    scroll={{ x: 1000 }}
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
                        onChange: (page, pageSize) => {

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

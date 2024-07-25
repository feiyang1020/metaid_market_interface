import usePageList from "@/hooks/usePageList"
import { getMrc20List } from "@/services/api"
import { ConfigProvider, Table, TableColumnsType, Grid, List, message, TableProps } from "antd"
import { useModel, history } from "umi"
import NumberFormat from "../NumberFormat";
import Item from "./Item";
import { useCallback, useEffect, useState } from "react";
import AllCard from "./AllCard";
const { useBreakpoint } = Grid;
type OnChange = NonNullable<TableProps<API.MRC20Info>['onChange']>;
type GetSingle<T> = T extends (infer U)[] ? U : never;
type Sorts = GetSingle<Parameters<OnChange>[2]>;
export default () => {
    const screens = useBreakpoint();
    const { network } = useModel("wallet")
    const { searchWord, AllPage: page, setAllPage: setPage } = useModel('mrc20')
    const [list, setList] = useState<API.MRC20Info[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    // const [page, setPage] = useState<number>(0);
    const [size, setSize] = useState<number>(10);
    const [params, setParams] = useState<Record<string, any>>({ orderBy: 'marketCap', sortType: -1 });
    const [orderBy, setOrderBy] = useState<string>('marketCap');
    const [sortType, setSortType] = useState<number>(-1);

    useEffect(() => {
        let didCancel = false;
        const fetchData = async () => {
            setLoading(true);
            const { code, message: msg, data } = await getMrc20List(network, {
                cursor: page * size,
                size,
                completed: true,
                searchTick: searchWord,
                orderBy,
                sortType,
            });
            if (didCancel) return
            if (code !== 0) {
                message.error(msg)
            }
            if (data && data.list) {
                setList(data.list);
                setTotal(data.total);
            } else {
                setList([])
                setTotal(0)
            }
            setLoading(false);
        };
        fetchData()
        return () => {
            didCancel = true;
        };
    }, [network, page, size, orderBy, sortType, searchWord])
    // const fetchData = useCallback(async () => {
    //     setLoading(true);
    //     const { code, message, data } = await getMrc20List(network, {
    //         cursor: page * size,
    //         size,
    //         completed: true,
    //         ...params,
    //     });
    //     if (code !== 0) return
    //     if (data.list) {
    //         setList(data.list);
    //         setTotal(data.total);
    //     }
    //     setLoading(false);
    // }, [network, page, size, params]);

    // useEffect(() => {
    //     fetchData();
    // }, [fetchData]);
    const columns: TableColumnsType<API.MRC20Info> = [
        {
            title: 'Token',
            dataIndex: 'tick',
            render: (_, record) => {
                return <Item info={record} />
            },
            // fixed: 'left',
            width: 220
        },
        {
            title: 'Price',
            dataIndex: 'price',
            sorter: true,
            align: 'center',
            render: (price) => {
                return <NumberFormat value={price} isBig tiny decimal={8} suffix=' BTC' />
            }
        },
        {
            title: 'Change 24H',
            dataIndex: 'change24h',
            sorter: true,
            align: 'center',
            render: (item) => {
                return <div style={{ color: item[0] !== '-' ? '#40BA68' : '#B94041' }}>{item}</div>
            }
        },
        {
            title: 'Market Cap',
            dataIndex: 'marketCap',
            sorter: true,
            align: 'center',
            render: (price) => {
                return <NumberFormat value={price} decimal={8} isBig suffix=' BTC' />
            }
        },
        {
            title: 'Total Supply',
            dataIndex: 'totalSupply',
            sorter: true,
            align: 'center',
            render: (price) => {
                return <NumberFormat value={price} />
            }
        },
        {
            title: 'Holders',
            dataIndex: 'holders',
            align: 'center',
            sorter: true,
        },
    ]

    return <ConfigProvider
        theme={{
            components: {
                "Tabs": {
                    "inkBarColor": "rgba(22, 119, 255, 0)",
                    "colorBorder": "rgba(0, 0, 0, 0)",
                    // colorBorderSecondary:'rgba(0, 0, 0, 0)'

                },
                "Table": {
                    "borderColor": "rgba(240, 240, 240, 0)",
                    "rowHoverBg": "rgba(110, 208, 63, 0.13)",

                }
            },
        }}>
        {screens.md ? <Table
            style={{ margin: screens.lg ? '0 20px ' : '0 0px' }}
            columns={columns}
            rowKey={(record) => record.mrc20Id}
            dataSource={list}
            pagination={{
                position: ['bottomCenter'],
                pageSize: size,
                current: page + 1,
                total,
                onChange: (page) => {
                    setPage(page - 1);
                },
            }}
            scroll={{ x: 800 }}
            loading={loading}
            onChange={(_1, _2, sorter) => {
                // setOrderBy(sorter.field || 'marketCap');
                // setSortType(sorter.order === 'ascend' ? 1 : -1);
                const { field, order } = sorter as Sorts;
                if (order) {
                    setOrderBy(( field || '').toString());
                    setSortType(order === 'ascend' ? 1 : -1);
                } else {
                    setOrderBy('marketCap');
                    setSortType(-1);
                }
            }}
            onRow={(record) => {
                return {
                    style: { cursor: 'pointer' },
                    onClick: () => {
                        history.push(`/mrc20/${record.tick}`)
                    },
                }
            }}
        /> : <List
            loading={loading}
            grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
            dataSource={list}
            renderItem={(item) => (
                <List.Item>
                    <AllCard record={item} />
                </List.Item>
            )}
            rowKey={"mrc20Id"}
            pagination={{
                onChange: (page) => {
                    setLoading(true);
                    setPage(page - 1);
                },
                position: "bottom",
                align: "center",
                pageSize: 10,
                total: total,
                current: page + 1,
            }}
        />}
    </ConfigProvider>
}
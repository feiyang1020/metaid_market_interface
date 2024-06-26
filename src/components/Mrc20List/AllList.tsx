import usePageList from "@/hooks/usePageList"
import { getMrc20List } from "@/services/api"
import { ConfigProvider, Table, TableColumnsType, Grid } from "antd"
import { useModel, history } from "umi"
import NumberFormat from "../NumberFormat";
import Item from "./Item";
const { useBreakpoint } = Grid;
export default () => {
    const screens = useBreakpoint();
    const { network } = useModel("wallet")
    const { list, loading, total, page, setPage, size, setParams } = usePageList(getMrc20List, network);
    const columns: TableColumnsType<API.MRC20Info> = [
        {
            title: 'Token',
            dataIndex: 'tick',
            render: (_, record) => {
                return <Item info={record} />
            },
            fixed: 'left',
            width: 220
        },
        {
            title: 'Price',
            dataIndex: 'price',
            sorter: true,
            render: (price) => {
                return <NumberFormat value={price} suffix=' sats' />
            }
        },
        {
            title: 'Change 24H',
            dataIndex: 'change24h',
            sorter: true,
            render: (item) => {
                return <div style={{ color: item[0] === '+' ? '#40BA68' : '#B94041' }}>{item}</div>
            }
        },
        {
            title: 'MarketCap',
            dataIndex: 'marketCap',
            sorter: true,
            render: (price) => {
                return <NumberFormat value={price} decimal={8} isBig suffix=' BTC' />
            }
        },
        {
            title: 'Total Supply',
            dataIndex: 'totalSupply',
            // sorter: true,
            render: (price) => {
                return <NumberFormat value={price} />
            }
        },
        {
            title: 'Holders',
            dataIndex: 'holders',
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
                    "rowHoverBg": "rgba(110, 208, 63, 0.13)"
                }
            },
        }}><Table
            style={{ margin: screens.lg ? '0 20px 0 200px' : '0 20px' }}
            columns={columns}
            rowKey={(record) => record.mrc20Id}
            dataSource={list}
            pagination={{
                pageSize: size,
                current: page + 1,
                total
            }}
            scroll={{ x: 1000 }}
            loading={loading}
            onChange={({ current, ...params }, _, sorter) => {
                console.log(sorter, 'params')
                if (!current) current = 1
                if (sorter.order) {
                    setParams({ orderBy: sorter.field === 'price' ? 'lastPrice' : sorter.field, sortType: sorter.order === 'ascend' ? 1 : -1 })
                }else{
                    setParams({}) 
                }
                setPage(current - 1)
            }}
            onRow={(record) => {
                return {
                    style: { cursor: 'pointer' },
                    onClick: () => {
                        history.push(`/mrc20/${record.mrc20Id}`)
                    },
                }
            }}
        />
    </ConfigProvider>
}
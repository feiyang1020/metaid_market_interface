import usePageList from "@/hooks/usePageList"
import { getMrc20List } from "@/services/api"
import { ConfigProvider, Table, TableColumnsType, Grid } from "antd"
import { useModel, history } from "umi"
const { useBreakpoint } = Grid;
export default () => {
    const screens = useBreakpoint();
    const { network } = useModel("wallet")
    const { list, loading, total, page, setPage, size, setParams } = usePageList(getMrc20List, network);
    const columns: TableColumnsType<API.MRC20Info> = [
        {
            title: 'Token',
            dataIndex: 'tick',

        },
        {
            title: 'Price',
            dataIndex: 'price',
            sorter: true,
        },
        {
            title: 'Change 24H',
            dataIndex: 'change24h',
            sorter: true,
        },
        {
            title: 'MarketCap',
            dataIndex: 'marketCap',
            sorter: true,
        },
        {
            title: 'Total Supply',
            dataIndex: 'totalSupply',
            sorter: true,
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
                    "borderColor": "rgba(240, 240, 240, 0)"
                }
            },
        }}><Table
            style={{ margin: screens.md ? '0 200px' : '0 20px' }}
            columns={columns}
            rowKey={(record) => record.mrc20Id}
            dataSource={list}
            pagination={{
                pageSize: size,
                current: page + 1,
                total
            }}
            loading={loading}
            onChange={({ current, ...params }, _, sorter) => {
                console.log(sorter, 'params')
                if (!current) current = 1
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
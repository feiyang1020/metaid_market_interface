import NumberFormat from "@/components/NumberFormat";
import { getMrc20Orders } from "@/services/api";
import { ConfigProvider, Table, TableColumnsType, Tooltip } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useModel } from "umi";
type Props = {
    mrc20Id: string
}
export default ({ mrc20Id }: Props) => {
    const { network, connected, connect, btcAddress, authParams } = useModel('wallet')
    const [list, setList] = useState<API.Mrc20Order[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [curOrder, setCurOrder] = useState<API.Mrc20Order>();
    const [page, setPage] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);
    const [size, setSize] = useState<number>(12);
    const fetchOrders = useCallback(async () => {
        console.log('fetchOrders', network, mrc20Id, page, size)
        if (!mrc20Id || !btcAddress) return;
        setLoading(true);

        const { data } = await getMrc20Orders(network, { assetType: 'mrc20', orderState: 3, sortKey: 'timestamp', address: btcAddress, sortType: -1, tickId: mrc20Id, cursor: page * size, size });
        if (data.list) {
            setList(data.list)
            setTotal(data.total);
        }
        setLoading(false);
    }, [mrc20Id, network, btcAddress])
    useEffect(() => { fetchOrders() }, [fetchOrders]);

    const columns: TableColumnsType<API.Mrc20Order> = [
        {
            title: 'Name',
            dataIndex: 'tick',
        },
        {
            title: 'Price',
            dataIndex: 'amount',
            sorter: true,
            render: (price) => {
                return <NumberFormat value={price} suffix=' sats' />
            }
        },
        {
            title: 'Type',
            dataIndex: 'buyerAddress',
            render: (item) => {
                return btcAddress===item?'Buy':'Sell'
            }
        },
        {
            title: "From",
            dataIndex: "sellerAddress",
            key: "sellerAddress",
            render: (text, record) => (
              <Tooltip title={text}>
                {text.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}
              </Tooltip>
            ),
          },
          {
            title: "To",
            dataIndex: "buyerAddress",
            key: "buyerAddress",
            render: (text, record) => (
              <Tooltip title={text}>
                {text.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}
              </Tooltip>
            ),
          },
          {
            title: "Time",
            dataIndex: "dealTime",
            key: "dealTime",
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
                  {text.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}
                </a>
              </Tooltip>
            ),
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

            columns={columns}
            rowKey={(record) => record.orderId}
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

        />
    </ConfigProvider>
}
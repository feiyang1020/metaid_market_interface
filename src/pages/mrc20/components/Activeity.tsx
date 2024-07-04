import MetaIdAvatar from "@/components/MetaIdAvatar";
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
  const [buyModalVisible, setBuyModalVisible] = useState<boolean>(false);
  const fetchOrders = useCallback(async () => {
    console.log('fetchOrders', network, mrc20Id, page, size)
    if (!mrc20Id) return;
    setLoading(true);

    const { data } = await getMrc20Orders(network, { assetType: 'mrc20', orderState: 3, sortKey: 'timestamp', sortType: -1, tickId: mrc20Id, cursor: page * size, size });
    if (data.list) {
      setList(data.list)
      setTotal(data.total);
    }
    setLoading(false);
  }, [mrc20Id, network,page,size])
  useEffect(() => { fetchOrders() }, [fetchOrders]);

  const columns: TableColumnsType<API.Mrc20Order> = [
    {
      title: 'Name',
      dataIndex: 'tick',

    },

    {
      title: 'Price',
      dataIndex: 'tokenPriceRate',
      sorter: true,
      render: (price,record) => {
        return <NumberFormat value={price} suffix={` sats/${record.tick}`} />
      }
    },
    {
      title: 'Type',
      dataIndex: 'buyerAddress',
      render: (item) => {
        return btcAddress === item ? 'Buy' : 'Sell'
      }
    },
    {
      title: "From",
      dataIndex: "sellerAddress",
      key: "sellerAddress",
      render: (text, record) => (
        <div className="detail">
          <span className='avatars'><MetaIdAvatar size={20} avatar={record.seller.avatar} /> {record.seller.name || record.sellerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}</span>
          <span className='metaid'>MetaID : {record.sellerMetaId.replace(/(\w{6})\w+(\w{5})/, "$1...")}</span>
        </div>
      ),
    },
    {
      title: "To",
      dataIndex: "buyerAddress",
      key: "buyerAddress",
      render: (text, record) => (
        <div className="detail">
          <span className='avatars'><MetaIdAvatar size={20} avatar={record.buyer.avatar} /> {record.buyer.name || record.buyerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}</span>
          <span className='metaid'>MetaID : {record.buyerMetaId.replace(/(\w{6})\w+(\w{5})/, "$1...")}</span>
        </div>
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
        total,
        onChange: (page) => {

          setLoading(true);
          setPage(page - 1);
      },
      }}
      scroll={{ x: 1000 }}
      className="activeityTable"
      loading={loading}
      // onChange={({ current, ...params }, _, sorter) => {
      //   console.log(sorter, 'params')
      //   if (!current) current = 1
      //   setPage(current - 1)
      // }}

    />
  </ConfigProvider>
}
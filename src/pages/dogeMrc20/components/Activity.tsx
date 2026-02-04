/**
 * Doge MRC-20 Activity 组件
 */
import { Table } from "antd";
import { useModel } from "umi";
import { getMrc20Orders } from "@/services/api";
import { useCallback, useEffect, useState } from "react";
import MetaIdAvatar from "@/components/MetaIdAvatar";
import { formatSat } from "@/utils/utlis";
import ChainIcon from "@/components/ChainIcon";
import NumberFormat from "@/components/NumberFormat";
import USDPrice from "@/components/USDPrice";
import { getDogeSource } from "@/utils/doge";

type Props = {
  mrc20Id: string;
};

export default ({ mrc20Id }: Props) => {
  const { network } = useModel("wallet");
  const [list, setList] = useState<API.Mrc20Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const size = 10;

  const fetchOrders = useCallback(async () => {
    if (!mrc20Id) return;
    setLoading(true);
    const params = {
      assetType: "mrc20",
      orderState: 3, // finished
      sortKey: "timestamp",
      sortType: -1 as -1,
      tickId: mrc20Id,
      cursor: page * size,
      size,
      source: getDogeSource(),
    };
    const { data } = await getMrc20Orders(network, params);
    if (data.list) {
      setList(data.list);
      setTotal(data.total);
    } else {
      setList([]);
      setTotal(0);
    }
    setLoading(false);
  }, [mrc20Id, network, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const columns = [
    {
      title: "Amount",
      dataIndex: "amountStr",
      key: "amountStr",
      render: (text: string, record: API.Mrc20Order) => (
        <span>
          {text} {record.tick}
        </span>
      ),
    },
    {
      title: "Price",
      dataIndex: "priceAmount",
      key: "priceAmount",
      render: (value: number) => (
        <span>
          <ChainIcon chain="doge" size={16} />{" "}
          <NumberFormat value={value} isBig decimal={8} /> DOGE
          <USDPrice value={value} decimals={8} chain="doge" />
        </span>
      ),
    },
    {
      title: "From",
      dataIndex: "sellerAddress",
      key: "sellerAddress",
      render: (text: string, record: API.Mrc20Order) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MetaIdAvatar size={20} avatar={record.seller.avatar} />
          <span>
            {record.seller.name ||
              record.sellerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}
          </span>
        </div>
      ),
    },
    {
      title: "To",
      dataIndex: "buyerAddress",
      key: "buyerAddress",
      render: (text: string, record: API.Mrc20Order) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MetaIdAvatar size={20} avatar={(record.buyer as any)?.avatar} />
          <span>
            {(record.buyer as any)?.name ||
              record.buyerAddress?.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}
          </span>
        </div>
      ),
    },
    {
      title: "Time",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (value: number) => new Date(value * 1000).toLocaleString(),
    },
  ];

  return (
    <Table
      loading={loading}
      dataSource={list}
      columns={columns}
      rowKey="orderId"
      pagination={{
        current: page + 1,
        pageSize: size,
        total: total,
        onChange: (p) => setPage(p - 1),
        showSizeChanger: false,
      }}
    />
  );
};

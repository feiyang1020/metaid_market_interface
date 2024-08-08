import { ArrowLeftOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Space, Table, TableProps, Tooltip } from "antd";
import { Link, useModel } from "umi";
import dayjs from "dayjs";
import "./index.less";
import { formatSat } from "@/utils/utlis";
import { useCallback, useEffect, useMemo, useState } from "react";
import JSONView from "@/components/JSONView";
import useIntervalAsync from "@/hooks/useIntervalAsync";
import { getContent, getOrders } from "@/services/api";
const items = ["Activity", "Buy", "Sell"];
export default () => {
  const { btcAddress, network } = useModel("wallet");
  const size = 10;
  const [sortKey, setSortKey] = useState<string>("timestamp");
  const [sortType, setSortType] = useState<number>(-1);
  const [cursor, setCursor] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [orders, setOrders] = useState<API.Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const fetchOrders = useCallback(
    async (retry: boolean = true) => {
      if (!btcAddress) {
        setOrders([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      if (network) {
        try {
          const ret = await getOrders(network, {
            assetType: "pins",
            orderState: 3,
            address: btcAddress,
            sortKey,
            sortType,
            cursor: cursor * size,
            size,
          });
          const list: API.Asset[] = ret.data.list.map((item) => {
            return {
              ...item,
              info: JSON.parse(item.detail),
            };
          });
          for (let i = 0; i < list.length; i++) {
            if (
              list[i].info &&
              list[i].info.contentTypeDetect.indexOf("text") > -1
            ) {
              const cont = await getContent(list[i].content);
              list[i].textContent = cont;
            }
          }
          setOrders(list);
          setTotal(ret.data.total);
          setLoading(false);
        } catch (err: any) {
          console.log(err);
          if (retry === true) {
            fetchOrders(false);
          }
        }
      }
    },
    [network, sortKey, sortType, cursor, btcAddress]
  );
  const updateOrders: any = useIntervalAsync(fetchOrders, 90000);
  const [tab, setTab] = useState<string>("");
  const list = useMemo(() => {
    if (tab === "Buy") {
      return orders.filter((item) => item.buyerAddress === btcAddress);
    }
    if (tab === "Sell") {
      return orders.filter((item) => item.sellerAddress === btcAddress);
    }
    if (tab === "Activity") {
      return orders.filter((item) => item.confirmationState === 1);
    }
    return orders;
  }, [orders, tab, btcAddress]);
  const columns: TableProps<API.Order>["columns"] = [
    {
      title: "PIN",
      dataIndex: "assetNumber",
      key: "assetNumber",
      render: (text, record) => {
        return (
          <div className="contetn">
            {record.info &&
              record.info.contentTypeDetect.indexOf("image") > -1 && (
                <img className="imageCont" src={record.content}></img>
              )}

            {record.textContent && (
              <JSONView textContent={record.textContent} collapsed={0} />
            )}
          </div>
        );
      },
    },
    {
      title: "Path",
      dataIndex: "Path",
      key: "Path",
      ellipsis: true,
      render: (_, record) => record.info.path,
    },
    {
      title: "POP",
      dataIndex: "assetPop",
      key: "assetPop",
    },
    {
      title: "Price",
      dataIndex: "sellPriceAmount",
      key: "sellPriceAmount",
      render: (text, record) => <>{formatSat(text)} BTC</>,
    },
    {
      title: "Type",
      dataIndex: "Type",
      key: "Type",
      render: (_, record) =>
        record.buyerAddress === btcAddress ? "Buy" : "Sell",
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
  ];
  return (
    <div className="historyPage animation-slide-bottom">
      <div
        className="title"
        onClick={() => {
          history.back();
        }}
      >
        <LeftOutlined /> Transaction History
      </div>
      <div className="tableWrap">
        <div className="tabs">
          <Space>
            {items.map((item) => (
              <Button
                key={item}
                type={tab === item ? "link" : "text"}
                onClick={() => {
                  tab === item ? setTab("") : setTab(item);
                }}
                size="large"
                disabled={item === "PINs"}
              >
                {item}
              </Button>
            ))}
          </Space>
        </div>
        <Table
          scroll={{ x: 1000 }}
          rowKey={"txId"}
          loading={loading}
          columns={columns}
          dataSource={list}
          pagination={{
            position: ['bottomCenter'],
            onChange: (page) => {
              setTab("");
              setLoading(true);
              setCursor(page - 1);
            },

            pageSize: size,
            total: total,
            current: cursor + 1,
          }}
          bordered
        />
      </div>
    </div>
  );
};

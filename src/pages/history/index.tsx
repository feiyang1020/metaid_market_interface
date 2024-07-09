import { ArrowLeftOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Space, Table, TableProps, Tooltip } from "antd";
import { Link, useModel } from "umi";
import dayjs from "dayjs";
import "./index.less";
import { formatSat } from "@/utils/utlis";
import { useEffect, useMemo, useState } from "react";
import JSONView from "@/components/JSONView";
const items = ["Activity", "Buy", "Sell"];
export default () => {
  const { btcAddress, network } = useModel("wallet");
  const {
    orders,
    loading,
    updateOrders,
    setLoading,
    total,
    setCursor,
    cursor,
    size,
  } = useModel("userHistory");
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
  useEffect(() => {
    setLoading(true);
    updateOrders();
  }, []);
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

import { ArrowLeftOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Space, Table, TableProps, Tooltip, message } from "antd";
import { Link, useModel } from "umi";
import dayjs from "dayjs";
import "./index.less";
import { formatSat } from "@/utils/utlis";
import { useCallback, useEffect, useMemo, useState } from "react";
import Popup from "@/components/ResponPopup";
import { cancelOrder, getContent, getOrders } from "@/services/api";
import JSONView from "@/components/JSONView";
import Mrc20Order from "./components/Mrc20Order";
import useIntervalAsync from "@/hooks/useIntervalAsync";
const items = ["PIN", 'MRC-20'];
export default () => {
  const { btcAddress, network, authParams } = useModel("wallet");

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
        setLoading(false);
        return;
      }
      if (network) {
        try {
          const ret = await getOrders(network, {
            assetType: "pins",
            orderState: 1,
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
  const [show, setShow] = useState<boolean>(false);
  const [tab, setTab] = useState<"PIN" | "MRC-20">("PIN");
  const [submiting, setSubmiting] = useState<boolean>(false);
  const [curOrder, setCurOrder] = useState<API.Order>();
  const list = useMemo(() => {
    return orders;
  }, [orders, btcAddress]);
  useEffect(() => {
    setLoading(true);
    updateOrders();
  }, []);
  const handleCancel = async () => {
    if (!curOrder || !btcAddress) return;
    setSubmiting(true);
    try {
      const ret = await cancelOrder(
        network,
        { orderId: curOrder.orderId },
        {
          headers: {
            ...authParams,
          },
        }
      );
      if (ret.code !== 0) throw new Error(ret.message);
      setLoading(true);
      await updateOrders();
      message.success("Successfully canceled listing");
      setShow(false);
      setCurOrder(undefined);
    } catch (err: any) {
      message.error(err.message);
    }
    setSubmiting(false);
  };
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
      title: "From",
      dataIndex: "sellerAddress",
      key: "sellerAddress",
      render: (text, record) => (
        <Tooltip title={text}>
          {text.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}
        </Tooltip>
      ),
    },
    // {
    //   title: "Time",
    //   dataIndex: "dealTime",
    //   key: "dealTime",
    //   render: (text) => dayjs(text).format("YYYY/MM/DD,HH:ss"),
    // },
    {
      title: "",
      dataIndex: "txId",
      key: "txId",
      // fixed: 'right',

      render: (text, record) => (
        <Button
          type="primary"
          onClick={() => {
            setCurOrder(record);
            setShow(true);
          }}
        >
          Cancel listing{" "}
        </Button>
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
        <LeftOutlined /> My Listing
      </div>

      <div className="tabs">
        <Space>
          {items.map((item) => (
            <Button
              key={item}
              type={tab === item ? "link" : "text"}
              onClick={() => setTab(item)}
              size="large"
            >
              {item}
            </Button>
          ))}
        </Space>
      </div>
      {
        tab === 'PIN' ? <div className="tableWrap">
          <Table
            scroll={{ x: 1000 }}
            rowKey={"txId"}
            loading={loading}
            columns={columns}
            dataSource={list}
            // pagination={{ position: ["none", "none"] }}
            bordered
            pagination={{
              position: ['bottomCenter'],
              pageSize: size,
              current: cursor + 1,
              total,
              onChange: (page) => {

                setLoading(true);
                setCursor(page - 1);
              },
            }}
          />
        </div> : <Mrc20Order />
      }


      <Popup
        title=""
        modalWidth={452}
        show={show}
        onClose={() => {
          setShow(false);
        }}
        closable={true}
        bodyStyle={{ padding: "28px 25px" }}
        className="buyModal"
      >
        <div className="cancelWrap">
          <div className="title">
            Are your sure you want to cancel your listing？
          </div>
          <div className="subTitle">
            This order may still be filled, if it was previously purchased but
            not completed on the blockchain.
          </div>
          <div className="buttons">
            <Button
              type="default"
              onClick={() => {
                setShow(false);
              }}
              block
            >
              Close
            </Button>
            <Button
              type="primary"
              onClick={() => {
                handleCancel();
              }}
              loading={submiting}
              block
            >
              Cancel listing
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  );
};

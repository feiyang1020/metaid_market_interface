import { ArrowLeftOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Space, Table, TableProps, Tooltip, message } from "antd";
import { Link, useModel } from "umi";
import dayjs from "dayjs";
import "./index.less";
import { formatSat } from "@/utils/utlis";
import { useEffect, useMemo, useState } from "react";
import Popup from "@/components/ResponPopup";
import { cancelOrder } from "@/services/api";

export default () => {
  const { btcAddress, network } = useModel("wallet");
  const { orders, loading, updateOrders, setLoading } = useModel("userOrders");
  const [show, setShow] = useState<boolean>(false);
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
    if (!curOrder) return;
    setSubmiting(true);
    try {
      const ret = await cancelOrder(network, { orderId: curOrder.orderId });
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
              <div className="textCont">{record.textContent}</div>
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
        <LeftOutlined /> Pending Order
      </div>
      <div className="tableWrap">
        <Table
          rowKey={"txId"}
          loading={loading}
          columns={columns}
          dataSource={list}
          pagination={{ position: ["none", "none"] }}
          bordered
        />
      </div>

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
              type='default'
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

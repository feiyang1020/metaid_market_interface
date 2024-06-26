import { ArrowLeftOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Space, Table, TableProps, Tooltip, message } from "antd";
import { Link, useModel } from "umi";
import dayjs from "dayjs";
import { formatSat } from "@/utils/utlis";
import { useCallback, useEffect, useMemo, useState } from "react";
import Popup from "@/components/ResponPopup";
import { authTest, cancelMRC20Order, cancelOrder, getMrc20InscribeOrders, getMrc20Orders } from "@/services/api";
import JSONView from "@/components/JSONView";
import NumberFormat from "@/components/NumberFormat";
import Item from "@/components/Mrc20List/Item";
const items = ["PIN", 'MRC20'];
export default () => {
  const { btcAddress, network, authParams } = useModel("wallet");
  const [show, setShow] = useState<boolean>(false);

  const [submiting, setSubmiting] = useState<boolean>(false);
  const [list, setList] = useState<API.Mrc20InscribeOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [size, setSize] = useState<number>(12);

  const fetchOrders = useCallback(async () => {
    if(!btcAddress) return;
    setLoading(true);
    const { data } = await getMrc20InscribeOrders(network, { opOrderType:'deploy', address: btcAddress,   cursor: page * size, size });
    if (data.list) {
      setList(data.list)
      setTotal(data.total);
    }
    setLoading(false);
  }, [network, btcAddress])
  useEffect(() => { fetchOrders() }, [fetchOrders]);
 
  const columns: TableProps<API.Mrc20InscribeOrder>["columns"] = [
    {
      title: 'Name',
      dataIndex: 'tick',
      render:(_,record)=><Item info={record} />
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
      title: "",
      dataIndex: "txId",
      key: "txId",
      fixed: 'right',

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
    <>

      <div className="tableWrap">
        <Table
          scroll={{ x: 1000 }}
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
    </>
  );
};

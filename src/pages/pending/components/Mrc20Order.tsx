import { ArrowLeftOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Space, Table, TableProps, Tooltip, message } from "antd";
import { history, useModel } from "umi";
import dayjs from "dayjs";
import { formatSat } from "@/utils/utlis";
import { useCallback, useEffect, useMemo, useState } from "react";
import Popup from "@/components/ResponPopup";
import { authTest, cancelMRC20Order, cancelOrder, getMrc20Orders } from "@/services/api";
import JSONView from "@/components/JSONView";
import NumberFormat from "@/components/NumberFormat";
export default () => {
  const { btcAddress, network, authParams } = useModel("wallet");
  const [show, setShow] = useState<boolean>(false);

  const [submiting, setSubmiting] = useState<boolean>(false);
  const [list, setList] = useState<API.Mrc20Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [curOrder, setCurOrder] = useState<API.Mrc20Order>();
  const [page, setPage] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [size, setSize] = useState<number>(12);
  const [buyModalVisible, setBuyModalVisible] = useState<boolean>(false);
  const fetchOrders = useCallback(async () => {
    setLoading(true);

    const { data } = await getMrc20Orders(network, { assetType: 'mrc20', orderState: 1, address: btcAddress, sortKey: 'timestamp', sortType: -1, cursor: page * size, size });
    if (data.list) {
      setList(data.list)
      setTotal(data.total);
    }
    setLoading(false);
  }, [network, btcAddress,page,size])
  useEffect(() => { fetchOrders() }, [fetchOrders]);
  const handleCancel = async () => {
    if (!curOrder || !btcAddress) return;
    setSubmiting(true);
    try {
      const ret = await cancelMRC20Order(
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
      await fetchOrders();
      message.success("Successfully canceled listing");
      setShow(false);
      setCurOrder(undefined);
    } catch (err: any) {
      message.error(err.message);
    }
    setSubmiting(false);
  };
  const columns: TableProps<API.Mrc20Order>["columns"] = [
    {
      title: 'Name',
      dataIndex: 'tick',
      
  },
  
  {
      title: 'Price',
      dataIndex: 'priceAmount',
      // sorter: true,
      render: (price) => {
          return <NumberFormat value={price} isBig decimal={8} suffix=' BTC'  />
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
      // /fixed: 'right',

      render: (text, record) => (
        <Button
          type="primary"
          onClick={(e) => {
            e.stopPropagation();
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
          rowKey={"orderId"}
          loading={loading}
          columns={columns}
          dataSource={list}
         
          bordered
          pagination={{
            position: ['bottomCenter'],
            pageSize: size,
            current: page + 1,
            total,
            onChange: (page) => {

                setLoading(true);
                setPage(page - 1);
            },
        }}
        onRow={(record) => {
            return {
                style: { cursor: 'pointer' },
                onClick: () => {
                    history.push(`/mrc20/${record.tick}`)
                },
            }
        }}
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

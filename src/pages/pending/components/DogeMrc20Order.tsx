import {
  CheckCircleFilled,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import {
  Button,
  Popover,
  Table,
  TableProps,
  Typography,
  message,
  theme,
} from "antd";
import { history, useModel } from "umi";
import { useCallback, useEffect, useState } from "react";
import Popup from "@/components/ResponPopup";
import {
  cancelMRC20Order,
  getMrc20Orders,
} from "@/services/api";
import NumberFormat from "@/components/NumberFormat";
import Trans from "@/components/Trans";
import { getDogeSource, DOGE_SATS_PER_COIN } from "@/utils/doge";

export default () => {
  const { dogeAddress, network, dogeAuthParams } = useModel("wallet");
  const [show, setShow] = useState<boolean>(false);
  const {
    token: { colorPrimary },
  } = theme.useToken();

  const [submiting, setSubmiting] = useState<boolean>(false);
  const [list, setList] = useState<API.Mrc20Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [curOrder, setCurOrder] = useState<API.Mrc20Order>();
  const [page, setPage] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [size, setSize] = useState<number>(12);

  const fetchOrders = useCallback(async () => {
    if (!dogeAddress) return;
    setLoading(true);

    const { data } = await getMrc20Orders(network, {
      assetType: "mrc20",
      orderState: 1,
      address: dogeAddress,
      sortKey: "timestamp",
      sortType: -1,
      cursor: page * size,
      size,
      source: getDogeSource(),
    });
    if (data.list) {
      setList(data.list);
      setTotal(data.total);
    }
    setLoading(false);
  }, [network, dogeAddress, page, size]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancel = async () => {
    if (!curOrder || !dogeAddress) return;
    setSubmiting(true);
    try {
      const ret = await cancelMRC20Order(
        network,
        { orderId: curOrder.orderId, chain: "doge" },
        {
          headers: {
            ...dogeAuthParams,
          },
        }
      );
      if (ret.code !== 0) throw new Error(ret.message);

      // Doge chain cancel listing - just cancel the order, no need to transfer back
      // The transfer back logic would need Doge-specific PSBT building
      message.success(<Trans>Successfully canceled listing</Trans>);
      setShow(false);
      setCurOrder(undefined);
      setLoading(true);
      await fetchOrders();
    } catch (err: any) {
      message.error(err.message);
    }
    setSubmiting(false);
  };

  const columns: TableProps<API.Mrc20Order>["columns"] = [
    {
      title: "Name",
      dataIndex: "tick",
    },

    {
      title: "Price",
      dataIndex: "priceAmount",
      render: (price) => {
        return (
          <NumberFormat
            value={price}
            isBig
            decimal={8}
            suffix=" DOGE"
          />
        );
      },
    },
    {
      title: "Type",
      dataIndex: "buyerAddress",
      render: (item) => {
        return dogeAddress === item ? "Buy" : "Sell";
      },
    },

    {
      title: "",
      dataIndex: "txId",
      key: "txId",

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
            position: ["bottomCenter"],
            pageSize: size,
            current: page + 1,
            total,
            onChange: (page, pageSize) => {
              setLoading(true);
              setPage(page - 1);
              setSize(pageSize || 10);
            },
          }}
          onRow={(record) => {
            return {
              style: { cursor: "pointer" },
              onClick: () => {
                history.push(`/doge-mrc20/${record.tick}`);
              },
            };
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
          <div
            className="subTitle"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <CheckCircleFilled style={{ color: colorPrimary }} />{" "}
              <Typography.Text>
                Cancel listing on Doge chain
              </Typography.Text>
            </div>
            <Popover
              content={
                <div style={{ width: 300 }}>
                  <Typography.Text>
                    This will cancel your listing on the Doge chain.
                  </Typography.Text>
                </div>
              }
            >
              <Button icon={<QuestionCircleOutlined />} type="text" />
            </Popover>
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

import { ArrowLeftOutlined, CheckCircleFilled, LeftOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Popover, Space, Table, TableProps, Tooltip, Typography, message, theme } from "antd";
import { history, useModel } from "umi";
import dayjs from "dayjs";
import { formatSat } from "@/utils/utlis";
import { useCallback, useEffect, useMemo, useState } from "react";
import Popup from "@/components/ResponPopup";
import { authTest, cancelMRC20Order, cancelOrder, getMrc20AddressUtxo, getMrc20Orders, transferMrc20Commit, transfertMrc20Pre } from "@/services/api";
import JSONView from "@/components/JSONView";
import NumberFormat from "@/components/NumberFormat";
import Trans from "@/components/Trans";
import { getPkScriprt } from "@/utils/orders";
import { transferMRC20PSBT } from "@/utils/mrc20";
export default () => {
  const { btcAddress, network, authParams, feeRate } = useModel("wallet");
  const [show, setShow] = useState<boolean>(false);
  const {
    token: { colorPrimary }
  } = theme.useToken()

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
  }, [network, btcAddress, page, size])
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

      // transferMRC20
      const { data: utxoList } = await getMrc20AddressUtxo(network, { address: btcAddress, tickId: String(curOrder.tickId), cursor: 0, size: 100 }, {
        headers: {
          ...authParams,
        },
      });
      if (utxoList.list.length === 0) throw new Error('No UTXO');
      const selectedUtxos = [];
      for (const utxo of utxoList.list) {
        if (utxo.orderId !== curOrder.orderId) continue;
        for (const tick of utxo.mrc20s) {
          selectedUtxos.push({
            utxoIndex: utxo.outputIndex,
            utxoTxId: utxo.txId,
            utxoOutValue: utxo.satoshi,
            tickerId: curOrder.tickId,
            amount: tick.amount,
            address: utxo.address,
            pkScript: utxo.scriptPk
          })
        }
      }
      const params: API.TransferMRC20PreReq = {
        networkFeeRate: feeRate,
        tickerId: curOrder.tickId,
        changeAddress: btcAddress,
        changeOutValue: 546,
        transfers: selectedUtxos,
        mrc20Outs: [{ amount: String(curOrder.amountStr), address: btcAddress, outValue: 546, pkScript: getPkScriprt(btcAddress, network).toString('hex') }]
      }

      const { code, message: _msg, data } = await transfertMrc20Pre(network, params, {
        headers: {
          ...authParams,
        },
      })
      if (code !== 0) throw new Error(_msg);

      const { rawTx, revealPrePsbtRaw } = await transferMRC20PSBT(data, feeRate, btcAddress, network);
      const res = await transferMrc20Commit(network, { orderId: data.orderId, commitTxRaw: rawTx, commitTxOutIndex: 0, revealPrePsbtRaw }, { headers: { ...authParams } });
      setLoading(true);
      await fetchOrders();
      message.success(<Trans>Successfully canceled listing</Trans>);
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
        return <NumberFormat value={price} isBig decimal={8} suffix=' BTC' />
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
            onChange: (page, pageSize) => {

              setLoading(true);
              setPage(page - 1);
              setSize(pageSize || 10);
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
          <div className="subTitle" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <CheckCircleFilled style={{ color: colorPrimary }} /> <Typography.Text>Return to wallet after delisting</Typography.Text>
            </div>
            <Popover content={<div style={{ width: 300 }}><Typography.Text>Selecting this option will trigger an on-chain transfer back to your wallet after delisting. This prevents your listed assets from being purchased. The process will incur a network gas fee.</Typography.Text></div>}>
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

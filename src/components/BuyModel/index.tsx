import {
  Alert,
  Button,
  InputNumber,
  Modal,
  Popover,
  Spin,
  Tooltip,
  message,
} from "antd";
import { useModel, history } from "umi";
import Popup from "../ResponPopup";
import { useCallback, useEffect, useMemo, useState } from "react";
import btcIcon from "@/assets/logo_btc@2x.png";
import { formatSat } from "@/utils/utlis";
import "./index.less";
import { BUY_PAY_INPUT_INDEX, SIGHASH_ALL, buildBuyTake } from "@/utils/orders";
import { buyOrder, getOrderPsbt } from "@/services/api";
import { Psbt } from "bitcoinjs-lib";
import SuccessModal, {
  DefaultSuccessProps,
  SuccessProps,
} from "../SuccessModal";
import { number } from "bitcoinjs-lib/src/script";
import JSONView from "../JSONView";
import { curNetwork } from "@/config";
type Props = {
  order: API.Order | undefined;
  show: boolean;
  onClose: () => void;
};
export default ({ order, show, onClose }: Props) => {
  const {
    feeRates,
    userBal,
    network,
    btcAddress,
    addressType,
    authParams,
    connected,
  } = useModel("wallet");
  const [submiting, setSubmiting] = useState<boolean>(false);
  const [customRate, setCustomRate] = useState<string | number>();
  const [orderWithPsbt, setOrderWithPsbt] = useState<API.Order>();
  const [calcing, setCalcing] = useState<boolean>(false);
  const [totalSpent, setTotalSpent] = useState<number>();
  const [fee, setFee] = useState<number>();
  const [errInfo, setErrInfo] = useState<string>();
  const [userBalInfo, setUserBalInfo] = useState<{
    total: number;
    confirmed: number;
    unconfirmed: number;
  }>();
  const [feeRateTab, setFeeRateTab] = useState<string>("Avg");
  const [successProp, setSuccessProp] =
    useState<SuccessProps>(DefaultSuccessProps);

  useEffect(() => {
    if (connected && window.metaidwallet) {
      window.metaidwallet.btc.getBalance().then((ret) => {
        setUserBalInfo(ret);
      });
    }
  }, [network, connected]);
  useEffect(() => {
    if (!show) {
      setCalcing(false);
      setTotalSpent(undefined);
      setFee(undefined);
      setErrInfo(undefined);
      setOrderWithPsbt(undefined);
    }
  }, [show]);
  const [buyPsbt, setBuyPsbt] = useState<Psbt>();
  const fetchTakePsbt = useCallback(async () => {
    console.log(order, connected, authParams, "authParams");
    if (!order || !connected || !authParams) {
      setOrderWithPsbt(undefined);
      return;
    }
    const address = await window.metaidwallet.btc.getAddress();
    if (connected && window.metaidwallet) {
      window.metaidwallet.btc.getBalance().then((ret) => {
        setUserBalInfo(ret);
      });
    }
    if (order.orderState !== 1) return;
    const { data, code, message } = await getOrderPsbt(
      network,
      {
        orderId: order.orderId,
        buyerAddress: address,
      },
      {
        headers: {
          ...authParams,
        },
      }
    );
    if (code !== 0) {
      setErrInfo(message);
      return;
    }
    setOrderWithPsbt(data);
  }, [network, order, connected, authParams]);
  useEffect(() => {
    fetchTakePsbt();
  }, [fetchTakePsbt]);
  // useEffect(() => {
  //   const find = feeRates.find((item) => item.label === "Avg");
  //   if (find) {
  //     setFeeRate((prev) => {
  //       if (!prev) return find.value;
  //       return prev;
  //     });
  //   }
  // }, [feeRates]);

  const feeRate = useMemo(() => {
    if (feeRateTab !== "custom") {
      const find = feeRates.find((item) => item.label === feeRateTab);
      if (find) return find.value;
      return 0;
    } else {
      return customRate || 0;
    }
  }, [feeRateTab, customRate, feeRates]);

  useEffect(() => {
    let didCancel = false;
    const calc = async () => {
      if (!orderWithPsbt || !connected) return;
      try {
        setCalcing(true);
        const { order, totalSpent, fee, error } = await buildBuyTake({
          order: {
            orderId: orderWithPsbt.orderId,
            feeAmount: orderWithPsbt.fee,
            price: orderWithPsbt.sellPriceAmount,
            utxoId: orderWithPsbt.utxoId,
          },
          network,
          takePsbtRaw: orderWithPsbt.takePsbt,
          feeRate: Number(feeRate),
        });
        console.log(order, totalSpent);
        if (didCancel) return;
        setCalcing(false);
        setTotalSpent(totalSpent);
        if (error) setErrInfo(error || undefined);
        setBuyPsbt(order);
        setFee(fee);
      } catch (err: any) {
        console.log(err);
        if (didCancel) return;
        setCalcing(false);
        setErrInfo(err.message || "unknow error");
      }
    };
    calc();
    return () => {
      didCancel = true;
    };
  }, [orderWithPsbt, network, connected, feeRate]);

  const handleBuy = async () => {
    if (!feeRate || !orderWithPsbt || !addressType || !connected || !order)
      return;
    setSubmiting(true);
    try {
      const { network: _net } = await window.metaidwallet.getNetwork();
      if (_net !== curNetwork || _net !== network) {
        throw new Error("network error");
      }
      const {
        order: orderPsbt,
        totalSpent,
        error,
      } = await buildBuyTake({
        order: {
          orderId: orderWithPsbt.orderId,
          feeAmount: orderWithPsbt.fee,
          price: orderWithPsbt.sellPriceAmount,
          utxoId: orderWithPsbt.utxoId,
        },
        network,
        takePsbtRaw: orderWithPsbt.takePsbt,
        feeRate: Number(feeRate),
      });
      if (error) throw new Error(error);
      const address = await window.metaidwallet.btc.getAddress();

      const inputsCount = orderPsbt.data.inputs.length;
      const toSignInputs = [];
      for (let i = BUY_PAY_INPUT_INDEX; i < inputsCount; i++) {
        toSignInputs.push({
          index: i,
          address,
          sighashTypes: [SIGHASH_ALL],
        });
      }
      console.log({ toSignInputs });
      const signed = await window.metaidwallet.btc.signPsbt({
        psbtHex: orderPsbt.toHex(),
        options: {
          autoFinalized: ["P2PKH", "P2SH"].includes(addressType),
          toSignInputs,
        },
      });
      if (typeof signed === "object") {
        if (signed.status === "canceled") throw new Error("canceled");
        throw new Error("");
      }
      const ret = await buyOrder(
        network,
        {
          orderId: order.orderId,
          takerPsbtRaw: signed,
          networkFeeRate: feeRate,
        },
        {
          headers: {
            ...authParams,
          },
        }
      );
      if (ret.code !== 0) {
        throw new Error(ret.message);
      }
      onClose();
      setSuccessProp({
        show: true,
        onClose: () => setSuccessProp(DefaultSuccessProps),
        onDown: () => setSuccessProp(DefaultSuccessProps),
        title: "Buy",
        tip: "Payment Successful",
        children: (
          <div className="buySuccess">
            <div className="orderInfo">
              <div className="contetn">
                {order.info &&
                  order.info.contentTypeDetect.indexOf("image") > -1 && (
                    <img className="imageCont" src={order.content}></img>
                  )}

                {order.textContent && (
                  <JSONView
                    textContent={order.textContent}
                    collapseStringsAfterLength={9}
                    collapsed={0}
                  />
                )}
              </div>
              <div className="dess">
                <div className="renu">#{order.assetNumber}</div>
                <div className="number">{order.info.path}</div>
              </div>
            </div>
            <div className="res">
              <div className="item">
                <div className="label">Transaction Price</div>
                <div className="value">
                  <img src={btcIcon}></img> {formatSat(totalSpent)}
                </div>
              </div>
              <div className="item">
                <div className="label">Tarde Hash</div>
                <div className="value">
                  <Tooltip title={ret.data.txId}>
                    <a
                      style={{ color: "#fff", textDecoration: "underline" }}
                      target="_blank"
                      href={
                        network === "testnet"
                          ? `https://mempool.space/testnet/tx/${ret.data.txId}`
                          : `https://mempool.space/tx/${ret.data.txId}`
                      }
                    >
                      {ret.data.txId.replace(/(\w{5})\w+(\w{5})/, "$1...$2")}
                    </a>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        ),
      });
    } catch (err) {
      console.log(err);
      message.error(err.message);
    }
    setSubmiting(false);
  };

  return (
    <>
      {order && (
        <Popup
          title="Buy Now"
          modalWidth={600}
          show={show}
          onClose={onClose}
          closable={true}
          bodyStyle={{ padding: "28px 25px" }}
          className="buyModal"
        >
          <div className="buyWrap">
            <div className="orderInfo">
              <div className="contetn">
                {order.info &&
                  order.info.contentTypeDetect.indexOf("image") > -1 && (
                    <img className="imageCont" src={order.content}></img>
                  )}

                {order.textContent && (
                  <JSONView
                    textContent={order.textContent}
                    collapseStringsAfterLength={9}
                    collapsed={0}
                  />
                )}
              </div>
              <div className="dess">
                <div className="renu">#{order.assetNumber}</div>
                <div className="number">{order.info.path}</div>
              </div>
            </div>
            <div className="fees">
              <div className="feeItem">
                <div className="label">Price</div>
                <div className="value">{order.sellPriceAmount} sats</div>
              </div>
              <div className="feeItem">
                <div className="label">
                  Taker Fee{order.feeRate > 0 && `(${order.feeRate}%)`}
                </div>
                <div className="value">{formatSat(order.fee)}BTC</div>
              </div>
              <div className="feeItem">
                <div className="label">Transaction Fee</div>
                <div className="value">
                  <Spin spinning={calcing}>{formatSat(fee || "0")}BTC</Spin>
                </div>
              </div>
            </div>
            <div className="netFee">
              <div className="netFeeTitle">Network Fee</div>
              <div className="netFeeOpts">
                {feeRates.map((item) => (
                  <div
                    onClick={() => setFeeRateTab(item.label)}
                    className={`feeRateItem ${
                      item.label === feeRateTab ? "active" : ""
                    }`}
                    key={item.label}
                  >
                    <div className="label">{item.label}</div>
                    <div className="value">{item.value} sat/vB</div>
                    <div className="time">{item.time}</div>
                  </div>
                ))}
                <div
                  className={`feeRateItem ${
                    feeRateTab === "custom" ? "active" : ""
                  }`}
                  onClick={() => {
                    setFeeRateTab("custom");
                  }}
                >
                  <div className="label">Custom rates</div>
                  <div className="value">
                    <InputNumber
                      value={customRate}
                      onChange={setCustomRate}
                      style={{ textAlign: "center" }}
                      controls={false}
                    />
                  </div>
                  <div className="time">sat/vB</div>
                </div>
              </div>
            </div>
            <Spin spinning={calcing}>
              <div className="payInfo">
                <div className="label">You Pay</div>
                <div className="value">
                  <img src={btcIcon} alt="" className="btc" />
                  <span>
                    {totalSpent ? formatSat(totalSpent || 0) : "--"}BTC
                  </span>
                </div>
              </div>
              {errInfo && (
                <Alert
                  message={errInfo}
                  type="error"
                  showIcon
                  style={{ marginTop: 10 }}
                />
              )}

              <div className="avail">
                <div className="label">Available balance</div>

                <div className="value">
                  {userBalInfo && formatSat(userBalInfo.confirmed)} BTC
                </div>
              </div>
            </Spin>

            <div className="btns">
              <Button
                style={{ height: 48 }}
                className="item"
                type="primary"
                onClick={handleBuy}
                loading={submiting}
                disabled={Boolean(errInfo) || calcing}
              >
                Confirm
              </Button>
              <Button
                style={{ height: 48 }}
                className="item"
                type="link"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Popup>
      )}

      <SuccessModal {...successProp} />
    </>
  );
};

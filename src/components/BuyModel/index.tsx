import { Button, InputNumber, Modal, Tooltip, message } from "antd";
import { useModel, history } from "umi";
import Popup from "../ResponPopup";
import { useCallback, useEffect, useState } from "react";
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
  const [feeRate, setFeeRate] = useState<number>();
  const [totalSpent, setTotalSpent] = useState<number>();
  const [successProp, setSuccessProp] =
    useState<SuccessProps>(DefaultSuccessProps);

  const [buyPsbt, setBuyPsbt] = useState<Psbt>();
  const fetchTakePsbt = useCallback(async () => {
    if (!order || !connected || !authParams) {
      setOrderWithPsbt(undefined);
      return;
    }
    const address = await window.metaidwallet.btc.getAddress();
    if (order.orderState !== 1) return;
    const { data } = await getOrderPsbt(
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
    setOrderWithPsbt(data);
  }, [network, order, connected, authParams]);
  useEffect(() => {
    fetchTakePsbt();
  }, [fetchTakePsbt]);
  useEffect(() => {
    const find = feeRates.find((item) => item.label === "Avg");
    if (find) {
      setFeeRate((prev) => {
        if (!prev) return find.value;
        return prev;
      });
    }
  }, [feeRates]);

  useEffect(() => {
    let didCancel = false;
    const calc = async () => {
      if (!orderWithPsbt || !connected || !feeRate) return;
      try {
        const { order, totalSpent } = await buildBuyTake({
          order: {
            orderId: orderWithPsbt.orderId,
            feeAmount: orderWithPsbt.fee,
            price: orderWithPsbt.sellPriceAmount,
          },
          network,
          takePsbtRaw: orderWithPsbt.takePsbt,
          feeRate,
        });
        console.log(order, totalSpent);
        if (didCancel) return;
        setTotalSpent(totalSpent);
        setBuyPsbt(order);
      } catch (err) {
        console.log(err);
      }
    };
    calc();
    return () => {
      didCancel = true;
    };
  }, [orderWithPsbt, network, connected, feeRate]);

  const handleBuy = async () => {
    if (!feeRate || !orderWithPsbt || !addressType || !connected) return;
    setSubmiting(true);
    try {
      const { order: orderPsbt, totalSpent } = await buildBuyTake({
        order: {
          orderId: orderWithPsbt.orderId,
          feeAmount: orderWithPsbt.fee,
          price: orderWithPsbt.sellPriceAmount,
        },
        network,
        takePsbtRaw: orderWithPsbt.takePsbt,
        feeRate,
      });
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
          autoFinalized: ["P2PKH"].includes(addressType),
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
              <div className="info">
                {order.info &&
                  order.info.contentTypeDetect.indexOf("image") > -1 && (
                    <img className="imageCont" src={order.content}></img>
                  )}

                {order.textContent && (
                  <div className="textCont">{order.textContent}</div>
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
              <div className="info">
                {order.info &&
                  order.info.contentTypeDetect.indexOf("image") > -1 && (
                    <img className="imageCont" src={order.content}></img>
                  )}

                {order.textContent && (
                  <div className="textCont">{order.textContent}</div>
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
            </div>
            <div className="netFee">
              <div className="netFeeTitle">Network Fee</div>
              <div className="netFeeOpts">
                {feeRates.map((item) => (
                  <div
                    onClick={() => setFeeRate(item.value)}
                    className={`feeRateItem ${
                      item.value === feeRate ? "active" : ""
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
                    customRate === feeRate ? "active" : ""
                  }`}
                  onClick={() => {
                    customRate && setFeeRate(Number(customRate));
                  }}
                >
                  <div className="label">Custom rates</div>
                  <div className="value">
                    <InputNumber
                      value={customRate}
                      onChange={setCustomRate}
                      suffix="sat/vB"
                    />{" "}
                  </div>
                  <div className="time"></div>
                </div>
              </div>
            </div>
            <div className="payInfo">
              <div className="label">You Pay</div>
              <div className="value">
                <img src={btcIcon} alt="" className="btc" />
                <span>{totalSpent ? formatSat(totalSpent || 0) : "--"}BTC</span>
              </div>
            </div>
            <div className="avail">
              <div className="label">Available balance</div>
              <div className="value">{userBal} BTC</div>
            </div>

            <div className="btns">
              <Button
                style={{ height: 48 }}
                className="item"
                type="primary"
                onClick={handleBuy}
                loading={submiting}
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

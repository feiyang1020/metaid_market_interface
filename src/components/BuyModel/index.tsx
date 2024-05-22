import { Button, Modal, message } from "antd";
import { useModel, history } from "umi";
import Popup from "../ResponPopup";
import { useCallback, useEffect, useState } from "react";
import btcIcon from "@/assets/logo_btc@2x.png";
import { formatSat } from "@/utils/utlis";
import "./index.less";
import { BUY_PAY_INPUT_INDEX, SIGHASH_ALL, buildBuyTake } from "@/utils/orders";
import { buyOrder, getOrderPsbt } from "@/services/api";
import { Psbt } from "bitcoinjs-lib";
type Props = {
  order: API.Order;
  show: boolean;
  onClose: () => void;
};
export default ({ order, show, onClose }: Props) => {
  const { feeRates, userBal, network, btcAddress } = useModel("wallet");
  const [submiting, setSubmiting] = useState<boolean>(false);
  const [orderWithPsbt, setOrderWithPsbt] = useState<API.Order>();
  const [feeRate, setFeeRate] = useState<number>();
  const [totalSpent, setTotalSpent] = useState<number>();

  const [buyPsbt, setBuyPsbt] = useState<Psbt>();
  const fetchTakePsbt = useCallback(async () => {
    if (!order || !btcAddress) return;
    const { data } = await getOrderPsbt(network, {
      orderId: order.orderId,
      buyerAddress: btcAddress,
    });
    setOrderWithPsbt(data);
  }, [network, order, btcAddress]);
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
      if (!orderWithPsbt || !btcAddress || !feeRate) return;
      try {
        const { order, totalSpent } = await buildBuyTake({
          order: {
            orderId: orderWithPsbt.orderId,
            feeAmount: orderWithPsbt.fee,
            price: orderWithPsbt.sellPriceAmount,
          },
          address: btcAddress,
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
  }, [orderWithPsbt, network, btcAddress, feeRate]);

  const handleBuy = async () => {
    if (!btcAddress || !feeRate || !orderWithPsbt) return;
    setSubmiting(true);
    try {
      const { order: orderPsbt, totalSpent } = await buildBuyTake({
        order: {
          orderId: orderWithPsbt.orderId,
          feeAmount: orderWithPsbt.fee,
          price: orderWithPsbt.sellPriceAmount,
        },
        address: btcAddress,
        network,
        takePsbtRaw: orderWithPsbt.takePsbt,
        feeRate,
      });
      const inputsCount = orderPsbt.data.inputs.length;
      const toSignInputs = [];
      for (let i = BUY_PAY_INPUT_INDEX; i < inputsCount; i++) {
        toSignInputs.push({
          index: i,
          address: btcAddress,
          sighashTypes: [SIGHASH_ALL],
        });
      }
      console.log({ toSignInputs });
      const signed = await window.metaidwallet.btc.signPsbt({
        psbtHex: orderPsbt.toHex(),
        options: {
          autoFinalized: false,
          toSignInputs,
        },
      });
      if (typeof signed === "object") {
        if (signed.status === "canceled") throw new Error("canceled");
        throw new Error("");
      }
      await buyOrder(network, {
        orderId: order.orderId,
        takerPsbtRaw: signed,
        networkFeeRate: feeRate,
      });
    } catch (err) {
      message.error(err.message);
    }
    setSubmiting(false);
  };
  return (
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
            <div className="renu">Renu</div>
            <div className="Inscripton">Inscripton</div>
            <div className="number">#{order.assetNumber}</div>
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
          </div>
        </div>
        <div className="payInfo">
          <div className="label">You Pay</div>
          <div className="value">
            <img src={btcIcon} alt="" className="btc" />
            <span>{formatSat(totalSpent || 0)}BTC</span>
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
  );
};

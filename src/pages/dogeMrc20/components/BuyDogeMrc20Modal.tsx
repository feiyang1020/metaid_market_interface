/**
 * Doge MRC-20 购买弹窗
 */
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
import Popup from "@/components/ResponPopup";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatSat } from "@/utils/utlis";
import "./BuyDogeMrc20Modal.less";
import { getMrc20OrderPsbt, buyMrc20OrderTake } from "@/services/api";
import { Psbt } from "bitcoinjs-lib";
import SuccessModal, {
  DefaultSuccessProps,
  SuccessProps,
} from "@/components/SuccessModal";
import MRC20Icon from "@/components/MRC20Icon";
import NumberFormat from "@/components/NumberFormat";
import Trans from "@/components/Trans";
import ChainIcon from "@/components/ChainIcon";
import USDPrice from "@/components/USDPrice";
import { getDogeSource } from "@/utils/doge";
import { buildDogeBuyMrc20TakePsbt, buyDogeMrc20Order } from "@/utils/dogeMrc20";

type Props = {
  order: API.Mrc20Order | undefined;
  show: boolean;
  onClose: () => void;
};

export default ({ order, show, onClose }: Props) => {
  const {
    dogeFeeRate,
    dogeUserBal,
    network,
    dogeAddress,
    dogeAuthParams,
    connected,
  } = useModel("wallet");
  const [submiting, setSubmiting] = useState<boolean>(false);

  const [orderWithPsbt, setOrderWithPsbt] = useState<API.BuyOrderPsbtRes>();
  const [calcing, setCalcing] = useState<boolean>(false);
  const [totalSpent, setTotalSpent] = useState<number>();
  const [fee, setFee] = useState<number>();
  const [errInfo, setErrInfo] = useState<string>();
  const [userBalInfo, setUserBalInfo] = useState<{
    total: number;
    confirmed: number;
    unconfirmed: number;
  }>();

  const [successProp, setSuccessProp] =
    useState<SuccessProps>(DefaultSuccessProps);

  useEffect(() => {
    if (connected && window.metaidwallet?.doge) {
      window.metaidwallet.doge.getBalance().then((ret: any) => {
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
    if (!order || !connected || !dogeAuthParams || !dogeAddress) {
      setOrderWithPsbt(undefined);
      return;
    }
    if (order.orderState !== 1) return;
    const { data, code, message: msg } = await getMrc20OrderPsbt(
      network,
      {
        orderId: order.orderId,
        buyerAddress: dogeAddress,
        source: getDogeSource(),
        chain: 'doge',
      },
      {
        headers: {
          ...dogeAuthParams,
        },
      }
    );
    if (code !== 0) {
      setErrInfo(msg);
      return;
    }
    setOrderWithPsbt(data);
  }, [network, order, connected, dogeAuthParams, dogeAddress]);

  useEffect(() => {
    fetchTakePsbt();
  }, [fetchTakePsbt]);

  useEffect(() => {
    let didCancel = false;
    const calc = async () => {
      if (!orderWithPsbt || !connected || !userBalInfo) return;
      try {
        setCalcing(true);
        if (orderWithPsbt.priceAmount + orderWithPsbt.fee > userBalInfo.total) {
          throw new Error("Insufficient balance");
        }
        const { psbt, totalSpent, fee, error } = await buildDogeBuyMrc20TakePsbt(
          orderWithPsbt,
          network,
          Number(dogeFeeRate),
          false,
          false
        );
        if (didCancel) return;
        setCalcing(false);
        setTotalSpent(totalSpent);
        setErrInfo(error || undefined);
        setBuyPsbt(psbt);
        setFee(fee);
      } catch (err: any) {
        console.log(err);
        if (didCancel) return;
        setErrInfo(err.message || "unknow error");
        setCalcing(false);
      }
    };
    calc();
    return () => {
      didCancel = true;
    };
  }, [orderWithPsbt, network, connected, dogeFeeRate, userBalInfo]);

  const handleBuy = async () => {
    if (
      !dogeFeeRate ||
      !orderWithPsbt ||
      !connected ||
      !order ||
      !dogeAddress
    )
      return;
    setSubmiting(true);
    try {
      const { rawTx, txOutputs } = await buyDogeMrc20Order(
        orderWithPsbt,
        network,
        Number(dogeFeeRate)
      );
      const ret = await buyMrc20OrderTake(
        network,
        {
          orderId: order.orderId,
          takerPsbtRaw: rawTx,
          networkFeeRate: Number(dogeFeeRate),
          chain: 'doge',
        },
        {
          headers: {
            ...dogeAuthParams,
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
        title: <Trans>Buy</Trans>,
        tip: <Trans>Payment Successful</Trans>,
        children: (
          <div className="buyMRCSuccess">
            <div className="orderInfo">
              <div className="contetn">
                <MRC20Icon
                  size={80}
                  tick={order.tick}
                  metadata={order.metaData}
                />
              </div>
              <div className="dess">
                <div className="renu">#{order.tick}</div>
              </div>
            </div>
            <div className="res">
              <div className="item">
                <div className="label">
                  <Trans>Transaction Price</Trans>
                </div>
                <div className="value">
                  <ChainIcon chain="doge" size={20} />
                  <NumberFormat
                    value={totalSpent || 0}
                    isBig
                    decimal={8}
                    minDig={8}
                    suffix=" DOGE"
                  />
                </div>
              </div>
              <div className="item">
                <div className="label">TxId </div>
                <div className="value">
                  <Tooltip title={ret.data.txId}>
                    <a
                      style={{ color: "#fff", textDecoration: "underline" }}
                      target="_blank"
                      href={`https://dogechain.info/tx/${ret.data.txId}`}
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
    } catch (err: any) {
      console.log(err);
      message.error(err.message);
    }
    setSubmiting(false);
  };

  return (
    <>
      {order && (
        <Popup
          title={<Trans>Buy Now</Trans>}
          modalWidth={600}
          show={show}
          onClose={onClose}
          closable={true}
          bodyStyle={{ padding: "28px 25px" }}
          className="buyMRCModal"
        >
          <div className="buyWrap">
            <div className="orderInfo">
              <div className="contetn">
                <MRC20Icon
                  size={80}
                  tick={order.tick}
                  metadata={order.metaData}
                />
              </div>
              <div className="dess">
                <div className="renu">#{order.tick}</div>
                <div className="number"></div>
              </div>
            </div>
            <div className="fees">
              <div className="feeItem">
                <div className="label">
                  <Trans>Price</Trans>
                </div>
                <div className="value">
                  <NumberFormat
                    value={order.priceAmount}
                    isBig
                    decimal={8}
                    minDig={8}
                    suffix=" DOGE"
                  />
                  <USDPrice
                    value={order.priceAmount}
                    decimals={8}
                    chain="doge"
                  />
                </div>
              </div>
              <div className="feeItem">
                <div className="label">
                  <Trans>Amount</Trans>
                </div>
                <div className="value">{order.amountStr}</div>
              </div>
              <div className="feeItem">
                <div className="label">
                  <Trans>Service Fee</Trans>
                </div>
                <div className="value">
                  {orderWithPsbt ? (
                    <NumberFormat
                      value={orderWithPsbt.fee}
                      isBig
                      decimal={8}
                      suffix=" DOGE"
                    />
                  ) : (
                    "--"
                  )}
                </div>
              </div>
              <div className="feeItem">
                <div className="label">
                  <Trans>Network Fee</Trans>
                </div>
                <div className="value">
                  {calcing ? (
                    <Spin size="small" />
                  ) : fee ? (
                    <NumberFormat value={fee} isBig decimal={8} suffix=" DOGE" />
                  ) : (
                    "--"
                  )}
                </div>
              </div>
              <div className="feeItem total">
                <div className="label">
                  <Trans>Total</Trans>
                </div>
                <div className="value">
                  {calcing ? (
                    <Spin size="small" />
                  ) : totalSpent ? (
                    <>
                      <ChainIcon chain="doge" size={20} />
                      <NumberFormat
                        value={totalSpent}
                        isBig
                        decimal={8}
                        minDig={8}
                        suffix=" DOGE"
                      />
                      <USDPrice value={totalSpent} decimals={8} chain="doge" />
                    </>
                  ) : (
                    "--"
                  )}
                </div>
              </div>
            </div>
            {errInfo && <Alert type="error" message={errInfo} />}
            <Button
              type="primary"
              block
              size="large"
              loading={submiting}
              disabled={!!errInfo || calcing || !totalSpent}
              onClick={handleBuy}
            >
              <Trans>Buy</Trans>
            </Button>
          </div>
        </Popup>
      )}
      <SuccessModal {...successProp} />
    </>
  );
};

import Order from "@/components/Order";
import { sellOrder } from "@/services/api";
import { buildAskLimit } from "@/utils/orders";
import { Button, Card, ConfigProvider, InputNumber, List, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useModel } from "umi";
import "./index.less";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import { formatSat } from "@/utils/utlis";
import SuccessModal, {
  DefaultSuccessProps,
  SuccessProps,
} from "@/components/SuccessModal";

export default () => {
  const { btcAddress, connect, connected, network } = useModel("wallet");
  const { orders, loading, updateOrders, setLoading } = useModel("sale");
  const [sellPrices, setSellPrices] = useState<Record<string, number>>({});
  const [checkList, setCheckList] = useState<string[]>([]);
  const [successProp, setSuccessProp] =
    useState<SuccessProps>(DefaultSuccessProps);
  const onInputChange = (assetId: string, amount: number) => {
    setSellPrices((prev) => {
      return {
        ...prev,
        [assetId]: amount,
      };
    });
  };
  const handleCheck = (assetId: string) => {
    if (checkList.includes(assetId)) {
      setCheckList(checkList.filter((item) => item !== assetId));
    } else {
      setCheckList([...checkList, assetId]);
    }
  };

  useEffect(() => {
    setLoading(true);
    updateOrders();
  }, []);

  const totalStas = useMemo(() => {
    const total = checkList.reduce((a, b) => {
      return a + sellPrices[b] || 0;
    }, 0);
    return total;
  }, [checkList, sellPrices]);
  const listOrder = async (utxoId: string, assetId: string, price: number) => {
    if (!btcAddress || !network) return;

    const ret = await buildAskLimit({
      total: price,
      utxoId,
      network,
    });
    const res = await sellOrder(network, {
      assetId,
      assetType: "pins",
      address: btcAddress,
      psbtRaw: ret,
    });
    if (res.code !== 0) {
      throw new Error(res.message);
    }
    console.log(res);
  };

  const handleSale = async () => {
    if (checkList.length === 0) return;
    for (let i = 0; i < checkList.length; i++) {
      if (!sellPrices[checkList[i]]) {
        const order = orders.find((item) => item.assetId === checkList[i]);
        message.error(`#${order?.assetNumber} No price set yet`);
        return;
      }
    }
    for (let i = 0; i < checkList.length; i++) {
      const order = orders.find((item) => item.assetId === checkList[i]);
      try {
        await listOrder(order?.utxoId, checkList[i], sellPrices[checkList[i]]);
       
      } catch (err: any) {
        console.log(err);
        message.error(`#${order?.assetNumber}: ${err.message}`);
        await updateOrders();
        return;
      }
    }
    setSuccessProp({
      show: true,
      onClose: () => setSuccessProp(DefaultSuccessProps),
      onDown: () => setSuccessProp(DefaultSuccessProps),
      title: "List for sale",
      tip: "Successful",
      children: <div className="saleSuccess"></div>,
    });
    setSellPrices({});
    setCheckList([]);
    await updateOrders();
  };
  return (
    <div className="salePage animation-slide-bottom">
      <div
        className="title"
        onClick={() => {
          history.back();
        }}
      >
        <LeftOutlined /> List for sale
      </div>
      <List
        className="listWrap"
        loading={loading}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 6 }}
        dataSource={orders}
        rowKey={"assetId"}
        renderItem={(item) => (
          <List.Item>
            <Card
              styles={{ body: { padding: 0 } }}
              className={
                checkList.includes(item.assetId)
                  ? "sellCard checked"
                  : "sellCard"
              }
            >
              <div className="cardWrap">
                <div
                  className="contetn"
                  onClick={() => handleCheck(item.assetId)}
                >
                  {item.info &&
                    item.info.contentTypeDetect.indexOf("image") > -1 && (
                      <img className="imageCont" src={item.content}></img>
                    )}

                  {item.textContent && (
                    <div className="textCont">{item.textContent}</div>
                  )}
                  <div className="assetNumber">
                    <ConfigProvider
                      theme={{
                        components: {
                          Button: {
                            colorTextLightSolid: "#fff",
                            primaryColor: "#fff",
                            colorPrimary: `rgba(51, 51, 51, 0.38)`,
                            colorPrimaryHover: `rgba(51, 51, 51, 0.38)`,
                            colorPrimaryActive: `rgba(51, 51, 51, 0.38)`,
                            lineWidth: 0,
                            primaryShadow: "0 0px 0 rgba(0, 0, 0, 0)",
                          },
                        },
                      }}
                    >
                      <Button type="primary">#{item.assetNumber}</Button>
                    </ConfigProvider>
                  </div>
                  <div className="checkBox">
                    {checkList.includes(item.assetId) ? (
                      <div className="checked">
                        <CheckOutlined />
                      </div>
                    ) : (
                      <div className="unchecked"></div>
                    )}
                  </div>
                </div>

                <div className="desc">
                  <div className="number">#{item.assetNumber}</div>
                  <div className="path">
                    {item.info && (item.info.pinPath || item.info.path)}
                  </div>
                </div>

                <div className="inputWrap">
                  <InputNumber
                    onChange={(value) => onInputChange(item.assetId, value)}
                    controls={false}
                    className="input"
                    value={sellPrices[item.assetId]}
                    suffix="sats"
                  />
                </div>
                <div className="btcAmount">
                  {formatSat(sellPrices[item.assetId] || 0)} BTC
                </div>
              </div>
            </Card>
          </List.Item>
        )}
      />
      <div className="totalPrice">
        <div className="label">Total Price</div>
        <div className="aciotns">
          <div className="prices">
            <div className="sats">{totalStas}sats</div>
            <div className="btc">{formatSat(totalStas)}BTC</div>
          </div>
          {connected ? (
            <Button
              type="primary"
              disabled={totalStas === 0}
              onClick={handleSale}
            >
              List for sale
            </Button>
          ) : (
            <Button type="primary" onClick={connect}>
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
      <SuccessModal {...successProp}></SuccessModal>
    </div>
  );
};

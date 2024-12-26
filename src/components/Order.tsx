import {
  Avatar,
  Button,
  Card,
  ConfigProvider,
  Divider,
  Menu,
  MenuProps,
  Skeleton,
  Tooltip,
  Typography,
} from "antd";
import { HomeOutlined, EditOutlined, UserOutlined } from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./order.less";
import level from "@/assets/level.svg";
import btc from "@/assets/logo_btc@2x.png";
import { useModel, history } from "umi";
import { formatSat } from "@/utils/utlis";
import MetaIdAvatar from "./MetaIdAvatar";
import JSONView from "./JSONView";
import { getContent } from "@/services/api";
import USDPrice from "./USDPrice";
import Trans from "./Trans";

type Props = {
  item: API.Order;
  handleBuy: (order: API.Order) => void;
};


export default ({ item: data, handleBuy }: Props) => {
  const { connected, connect } = useModel("wallet");
  const [item, setItem] = useState<API.Order>(data)
  const [loading, setLoading] = useState<boolean>(true);
  const fetchPinContent = useCallback(async () => {
    const _item = data
    if (data && data.info.contentTypeDetect.indexOf("text") > -1 && data.textContent === undefined) {
      const cont = await getContent(data.content);
      _item.textContent = cont;
    }
    setItem(_item)
    setLoading(false)
  }, [data])

  useEffect(() => {
    fetchPinContent()
  }, [fetchPinContent])

  const name = useMemo(() => {
    if (item.seller && item.seller.name) return item.seller.name;
    return item.sellerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2");
  }, [item]);
  return (
    <Card styles={{ body: { padding: 0 } }} hoverable className="orderCard">
      <div className="cardWrap">
        <div className="contentWrap"></div>
        <div
          className="contetn"
          onClick={() => {
            history.push(`/order?id=${item.orderId}`);
          }}
          style={{
            backgroundImage:
              item.info && item.info.contentTypeDetect.indexOf("image") > -1
                ? `url(${item.content})`
                : "none",
          }}
        >
          {
            loading && !item.textContent && <Skeleton active />
          }
          {item.textContent && (
            <JSONView textContent={item.textContent} />
          )}
        </div>
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

        <div className="desc">
          <div className="number">#{item.assetNumber}</div>
          <div className="path">
            {item.info && (item.info.pinPath || item.info.path)}
          </div>
        </div>
        <div className="user">
          <div className="holderWrap">
            <div className="label"><Trans>Holder</Trans></div>
            <div className="holder">
              <MetaIdAvatar
                avatar={item.seller.avatar}
                size={20}
                style={{ minWidth: 20 }}
              />
              <div className="name"><Tooltip title={(item.seller && item.seller.name) || item.sellerAddress}>{name}</Tooltip></div>
            </div>
          </div>
          <Divider type="vertical" />
          <div className="holderWrap">
            <div className="label"><Trans>Pop</Trans></div>
            <div className="holder pop">
              <div className="name">{item.assetPop}</div>
              <div className="level">
                {item.assetLevel !== "--" && item.assetPop !== "--" ? (
                  <>
                    <img src={level} alt="" />
                    {item.assetLevel}
                  </>
                ) : (
                  <span>--</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="price ">
          <img src={btc} className="btcLogo" alt="" />{" "}
          <span>{formatSat(item.sellPriceAmount)} BTC</span>
          <USDPrice value={item.sellPriceAmount} decimals={8} />
        </div>

        <div className="btn animation-slide-bottom">
          {connected ? (
            <Button
              type="primary"
              style={{ height: 40 }}
              block
              onClick={() => {
                handleBuy(item);
              }}
            >
              <Trans>Buy</Trans>
            </Button>
          ) : (
            <Button
              type="primary"
              style={{ height: 40 }}
              block
              onClick={connect}
            >
              <Trans>Connect Wallet</Trans>
              
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

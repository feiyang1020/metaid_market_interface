import {
  Avatar,
  Button,
  Card,
  ConfigProvider,
  Divider,
  Menu,
  MenuProps,
  Typography,
} from "antd";
import { HomeOutlined, EditOutlined, UserOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import "./order.less";
import level from "@/assets/level.svg";
import btc from "@/assets/logo_btc@2x.png";
import { useModel, history } from "umi";
import { formatSat } from "@/utils/utlis";
import MetaIdAvatar from "./MetaIdAvatar";
import JSONView from "./JSONView";

type Props = {
  item: API.Order;
  handleBuy: (order: API.Order) => void;
};
const { Text } = Typography;
const EllipsisMiddle: React.FC<{ suffixCount: number; children: string }> = ({
  suffixCount,
  children,
}) => {
  const start = children.slice(0, children.length - suffixCount);
  const suffix = children.slice(-suffixCount).trim();
  return (
    <Text style={{ maxWidth: "100%" }} ellipsis={{ suffix }}>
      {start}
    </Text>
  );
};

export default ({ item, handleBuy }: Props) => {
  const { connected, connect } = useModel("wallet");

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
          {item.textContent && (
            <JSONView textContent={item.textContent}/>
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
            <div className="label">Holder</div>
            <div className="holder">
              <MetaIdAvatar
                avatar={item.seller.avatar}
                size={20}
                style={{ minWidth: 20 }}
              />
              <div className="name">{name}</div>
            </div>
          </div>
          <Divider type="vertical" />
          <div className="holderWrap">
            <div className="label">Pop</div>
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
              Buy
            </Button>
          ) : (
            <Button
              type="primary"
              style={{ height: 40 }}
              block
              onClick={connect}
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

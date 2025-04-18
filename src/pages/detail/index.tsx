import { getContent, getOrder, getOrderPsbt } from "@/services/api";
import { Avatar, Button, Col, Row, Space, Spin, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useModel, useSearchParams } from "umi";
import level from "@/assets/level.svg";
import "./index.less";
import btc from "@/assets/logo_btc@2x.png";
import { LeftOutlined, UserOutlined } from "@ant-design/icons";
import BuyModel from "@/components/BuyModel";
import { formatSat } from "@/utils/utlis";
import MetaIdAvatar from "@/components/MetaIdAvatar";
import dayjs from "dayjs";
import JSONView from "@/components/JSONView";
import Trans from "@/components/Trans";
import USDPrice from "@/components/USDPrice";
export default () => {
  const { network, connect, connected, btcAddress, addressType } =
    useModel("wallet");
  const [loading, setLoading] = useState<boolean>(true);
  const [expanded, setExpanded] = useState(false);
  const [show, setShow] = useState<boolean>(false);
  const [order, setOrder] = useState<API.Order>();
  const [query] = useSearchParams();
  const id = query.get("id");
  const name = useMemo(() => {
    if (!order) return "";
    if (order && order.seller && order.seller.name) return order.seller.name;
    return order.sellerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2");
  }, [order]);
  const fetchPin = useCallback(async () => {
    if (!id) return;
    const ret = await getOrder(network, { orderId: id });
    let data = {
      ...ret.data,
      info: JSON.parse(ret.data.detail),
    };
    if (data.info.contentTypeDetect.indexOf("text") > -1) {
      const cont = await getContent(data.content);
      data.textContent = cont;
    }
    setOrder(data);
    setLoading(false);
  }, [id]);
  useEffect(() => {
    fetchPin();
  }, [fetchPin]);
  const handelBuy = async () => {
    if (!connected || !id || !btcAddress) return;
    setShow(true);
  };
  return (
    <div className="detailPage animation-slide-bottom">
      <div
        className="backTitle"
        onClick={() => {
          history.back();
        }}
      >
        <LeftOutlined />
      </div>
      <Spin spinning={loading} className="detailWrap">
        {order && (
          <Row
            align={"top"}
            justify={"center"}
            className="detailWrap"
            gutter={[50, 50]}
          >
            <Col
              {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
              className="left"
            >
              <div
                className="detailContent"
                style={{
                  backgroundImage:
                    order.info &&
                      order.info.contentTypeDetect.indexOf("image") > -1
                      ? `url(${order.content})`
                      : "none",
                }}
              >
                {order.textContent && (
                  <JSONView textContent={order.textContent} />
                )}
              </div>
            </Col>
            <Col
              {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
              className="right"
            >
              <div className="orderName">#{order.assetNumber}</div>
              <div className="path">{order.info.path} </div>
              {/* <div className="titleWrap">
                <div className="title">Inscription </div>
                <div className="subTitle"> </div>
              </div> */}
              <div className="userWrap">
                <div className="holder">
                  <MetaIdAvatar avatar={order.seller.avatar} size={20} />

                  <div className="name">{name}</div>
                </div>
              </div>
              <div className="priceWrap">
                <div className="label"><Trans>Price</Trans>  </div>
                <div className="values">
                  <img src={btc} alt="" />
                  {formatSat(order.sellPriceAmount)}
                  <USDPrice value={order.sellPriceAmount} decimals={8} />
                </div>
              </div>
              {connected ? (
                <Button
                  style={{ width: 337, height: 48 }}
                  type="primary"
                  onClick={handelBuy}
                  disabled={order.orderState !== 1}
                >
                  <Trans>Buy</Trans>
                </Button>
              ) : (
                <Button
                  style={{ width: 337, height: 48 }}
                  type="primary"
                  onClick={connect}
                >
                  <Trans>Connect Wallet</Trans>
                </Button>
              )}
              {order.textContent && (
                <div className="pinDetail">
                  <div className="title"><Trans>Content</Trans></div>
                  <Typography.Paragraph
                    ellipsis={{
                      rows: 3,
                      expandable: "collapsible",
                      expanded,
                      onExpand: (_, info) => setExpanded(info.expanded),
                    }}
                    copyable
                    style={{ color: "color: rgba(255, 255, 255, 0.5)" }}
                  >
                    {JSON.stringify(order.textContent)}
                  </Typography.Paragraph>
                </div>
              )}

              <div className="pinDetail">
                <div className="title"><Trans>PIN Details</Trans></div>
                <div className="detailInfo">
                  <Row className="row" gutter={[16, 16]}>
                    <Col
                      {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
                    >
                      <div className="label"><Trans>Operation</Trans></div>
                      <div className="value">
                        {order.info.operation || "--"}
                      </div>
                    </Col>
                    <Col
                      {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
                    >
                      <div className="label"><Trans>Address</Trans></div>
                      <div className="value">
                        {order.info.createAddress || "--"}
                      </div>
                    </Col>
                    <Col
                      {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
                    >
                      <div className="label"><Trans>ID</Trans></div>
                      <div className="value">{order.info.pinId || "--"}</div>
                    </Col>
                    <Col
                      {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
                    >
                      <div className="label"><Trans>PoP</Trans></div>
                      <div className="value">
                        {order.info.popSummary || "--"}{" "}
                        <div className="level">
                          {order.assetLevel !== "--" &&
                            order.assetPop !== "--" ? (
                            <>
                              <img src={level} alt="" />
                              {order.assetLevel}
                            </>
                          ) : (
                            <span>--</span>
                          )}
                        </div>
                      </div>
                    </Col>
                    {/* <Col span={12}>
                      <div className="label">Root-TxID</div>
                      <div className="value">
                        { "--"}
                      </div>
                    </Col> */}
                    <Col
                      {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
                    >
                      <div className="label">MetaID</div>
                      <div className="value">{order.info.metaid || "--"}</div>
                    </Col>
                    <Col
                      {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
                    >
                      <div className="label"><Trans>Path</Trans></div>
                      <div className="value">{order.info.path || "--"}</div>
                    </Col>
                    <Col
                      {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
                    >
                      <div className="label"><Trans>Original-Path</Trans></div>
                      <div className="value">
                        {order.info.originalPath || "--"}
                      </div>
                    </Col>
                    <Col
                      {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
                    >
                      <div className="label"><Trans>Version</Trans></div>
                      <div className="value">{order.info.version || "--"}</div>
                    </Col>
                    <Col
                      {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
                    >
                      <div className="label"><Trans>Encryption</Trans></div>
                      <div className="value">
                        {order.info.encryption || "--"}
                      </div>
                    </Col>
                    <Col
                      {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
                    >
                      <div className="label"><Trans>Output-Value</Trans></div>
                      <div className="value">
                        {order.info.outputValue || "--"}
                      </div>
                    </Col>
                    <Col
                      {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
                    >
                      <div className="label"><Trans>Content-Length</Trans></div>
                      <div className="value">
                        {order.info.contentLength || "--"}
                      </div>
                    </Col>
                    <Col
                      {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
                    >
                      <div className="label"><Trans>Preview</Trans></div>
                      <div className="value">
                        <a href={order.preview} target="_blank">
                          {order.preview || "--"}
                        </a>
                      </div>
                    </Col>
                    <Col
                      {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
                    >
                      <div className="label"><Trans>Content</Trans></div>
                      <div className="value">
                        {" "}
                        <a href={order.content} target="_blank">
                          {order.content || "--"}
                        </a>{" "}
                      </div>
                    </Col>
                    <Col
                      {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
                    >
                      <div className="label"><Trans>Content-Type</Trans></div>
                      <div className="value">
                        {order.info.contentTypeDetect || "--"}
                      </div>
                    </Col>
                    <Col
                      {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
                    >
                      <div className="label"><Trans>Time(UTC)</Trans></div>
                      <div className="value">
                        {dayjs(order.info.timestamp * 1000).format(
                          "YYYY/MM/DD,HH:mm"
                        ) || "--"}
                      </div>
                    </Col>
                    <Col
                      {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
                    >
                      <div className="label"><Trans>Genesis-Height</Trans></div>
                      <div className="value">
                        {order.info.genesisHeight || "--"}
                      </div>
                    </Col>
                    <Col
                      {...{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
                    >
                      <div className="label"><Trans>Genesis-Transaction</Trans></div>
                      <div className="value">
                        {order.info.genesisTransaction || "--"}
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>
          </Row>
        )}
      </Spin>
      {order && (
        <BuyModel
          order={order}
          show={show}
          onClose={() => {
            fetchPin();
            setShow(false);
          }}
        ></BuyModel>
      )}
    </div>
  );
};

import { getContent, getOrder, getOrderPsbt } from "@/services/api";
import { Avatar, Button, Col, Row, Space, Spin } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useModel, useSearchParams } from "umi";
import "./index.less";
import btc from "@/assets/logo_btc@2x.png";
import { UserOutlined } from "@ant-design/icons";
import { buyOrder } from "@/utils/psbtBuild";
import BuyModel from "@/components/BuyModel";
import { formatSat } from "@/utils/utlis";
export default () => {
  const { network, connect, connected, btcAddress, addressType } =
    useModel("wallet");
  const [loading, setLoading] = useState<boolean>(true);
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
      data.textContent = JSON.stringify(cont);
    }
    console.log(data.info, "Operation");
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
      <Spin spinning={loading} className="detailWrap">
        {order && (
          <div className="detailWrap">
            <div className="left">
              <div className="detailContent">
                {order.textContent || <img src={order.content}></img>}
              </div>
            </div>
            <div className="right">
              <div className="orderName">Rune Stone</div>
              <div className="titleWrap">
                <div className="title">Inscription </div>
                <div className="subTitle">#{order.assetNumber} </div>
              </div>
              <div className="userWrap">
                <Space className="holder">
                  <Avatar
                    style={{ backgroundColor: "#D4F66B" }}
                    icon={<UserOutlined />}
                    size={20}
                  />
                  <div className="name">{name}</div>
                </Space>
              </div>
              <div className="priceWrap">
                <div className="label">Price</div>
                <div className="values">
                  <img src={btc} alt="" />
                  {formatSat(order.sellPriceAmount)}
                </div>
              </div>
              {connected ? (
                <Button
                  style={{ width: 337, height: 48 }}
                  type="primary"
                  onClick={handelBuy}
                >
                  Buy
                </Button>
              ) : (
                <Button
                  style={{ width: 337, height: 48 }}
                  type="primary"
                  onClick={connect}
                >
                  Connect Wallet
                </Button>
              )}
              <div className="pinDetail">
                <div className="title">PINDetails</div>
                <div className="detailInfo">
                  <Row className="row" gutter={[16,16]}>
                    <Col span={12}>
                      <div className="label">Operation</div>
                      <div className="value">
                        {order.info.operation || "--"}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="label">Address</div>
                      <div className="value">
                        {order.info.createAddress || "--"}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="label">ID</div>
                      <div className="value">{order.info.pinId || "--"}</div>
                    </Col>
                    <Col span={12}>
                      <div className="label">PoP</div>
                      <div className="value">
                        {order.info.popSummary || "--"}
                      </div>
                    </Col>
                    {/* <Col span={12}>
                      <div className="label">Root-TxID</div>
                      <div className="value">
                        { "--"}
                      </div>
                    </Col> */}
                    <Col span={12}>
                      <div className="label">MetaID</div>
                      <div className="value">{order.info.metaid || "--"}</div>
                    </Col>
                    <Col span={12}>
                      <div className="label">Path</div>
                      <div className="value">{order.info.path || "--"}</div>
                    </Col>
                    <Col span={12}>
                      <div className="label">Original-Path</div>
                      <div className="value">
                        {order.info.originalPath || "--"}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="label">Version</div>
                      <div className="value">{order.info.version || "--"}</div>
                    </Col>
                    <Col span={12}>
                      <div className="label">Encryption</div>
                      <div className="value">
                        {order.info.encryption || "--"}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="label">Output-Value</div>
                      <div className="value">
                        {order.info.outputValue || "--"}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="label">Content-Length</div>
                      <div className="value">
                        {order.info.contentLength || "--"}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="label">Preview</div>
                      <div className="value">{order.preview || "--"}</div>
                    </Col>
                    <Col span={12}>
                      <div className="label">Content</div>
                      <div className="value">{order.content || "--"}</div>
                    </Col>
                    <Col span={12}>
                      <div className="label">Content-Type</div>
                      <div className="value">
                        {order.info.contentTypeDetect || "--"}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="label">Time(UTC)</div>
                      <div className="value">
                        {order.info.timestamp || "--"}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="label">Genesis-Height</div>
                      <div className="value">
                        {order.info.genesisHeight || "--"}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="label">Genesis-Transaction:</div>
                      <div className="value">
                        {order.info.genesisTransaction || "--"}
                      </div>
                    </Col>
                    
                  </Row>
                </div>
              </div>
            </div>
          </div>
        )}
      </Spin>
      {order && (
        <BuyModel
          order={order}
          show={show}
          onClose={() => setShow(false)}
        ></BuyModel>
      )}
    </div>
  );
};

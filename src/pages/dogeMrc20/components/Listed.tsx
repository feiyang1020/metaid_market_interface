/**
 * Doge MRC-20 Listed 组件
 * 显示上架的 Doge MRC-20 代币列表，支持购买和取消上架
 */
import { useModel } from "umi";
import {
  cancelMRC20Order,
  getMrc20AddressUtxo,
  getMrc20OrderPsbt,
  getMrc20Orders,
  transferMrc20Commit,
  transfertMrc20Pre,
} from "@/services/api";
import { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  ConfigProvider,
  Divider,
  List,
  Tooltip,
  message,
} from "antd";
import MetaIdAvatar from "@/components/MetaIdAvatar";
import { formatSat } from "@/utils/utlis";
import "./index.less";
import BuyDogeMrc20Modal from "./BuyDogeMrc20Modal";
import NumberFormat from "@/components/NumberFormat";
import MRC20Icon from "@/components/MRC20Icon";
import CancelListing from "@/components/CancelListing";
import Sorter from "@/components/Sorter";
import Trans from "@/components/Trans";
import USDPrice from "@/components/USDPrice";
import ChainIcon from "@/components/ChainIcon";
import { getDogeSource } from "@/utils/doge";

type Props = {
  mrc20Id: string;
  metaData: string;
  showMy?: boolean;
};

export default ({ mrc20Id, metaData, showMy = false }: Props) => {
  const { network, connected, connect, dogeAddress, dogeAuthParams, dogeFeeRate } =
    useModel("wallet");
  const [list, setList] = useState<API.Mrc20Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [curOrder, setCurOrder] = useState<API.Mrc20Order>();
  const [page, setPage] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [size, setSize] = useState<number>(12);
  const [cancelSubmiting, setCancelSubmiting] = useState<boolean>(false);
  const [buyModalVisible, setBuyModalVisible] = useState<boolean>(false);
  const [cancelModalVisible, setCancelModalVisible] = useState<boolean>(false);
  const [orderBy, setOrderBy] = useState<string>("tokenPriceRate");
  const [sortType, setSortType] = useState<1 | -1>(1);

  const fetchOrders = useCallback(async () => {
    if (!mrc20Id || (showMy && !dogeAddress)) return;
    setLoading(true);
    const params: any = {
      assetType: "mrc20",
      orderState: 1,
      sortKey: orderBy,
      sortType: sortType,
      tickId: mrc20Id,
      cursor: page * size,
      size,
      source: getDogeSource(), // Doge 链参数
    };
    if (showMy && dogeAddress) {
      params.address = dogeAddress;
    }
    const { data } = await getMrc20Orders(network, params);
    if (data.list) {
      setList(data.list);
      setTotal(data.total);
    } else {
      setList([]);
      setTotal(0);
    }
    setLoading(false);
  }, [mrc20Id, network, page, size, dogeAddress, showMy, orderBy, sortType]);

  const handleCancel = async () => {
    if (!curOrder || !dogeAddress) return;
    setCancelSubmiting(true);
    try {
      const ret = await cancelMRC20Order(
        network,
        { orderId: curOrder.orderId, chain: 'doge' },
        {
          headers: {
            ...dogeAuthParams,
          },
        }
      );
      if (ret.code !== 0) throw new Error(ret.message);

      // TODO: 实现 Doge 链的取消上架逻辑
      message.info("Doge cancel listing coming soon");

      setLoading(true);
      await fetchOrders();
      message.success(<Trans>Successfully canceled listing</Trans>);
      setCancelModalVisible(false);
      setCurOrder(undefined);
    } catch (err: any) {
      message.error(err.message);
    }
    setCancelSubmiting(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div>
      <div className="list">
        <Sorter
          sorters={[
            { label: "Unit Price", key: "tokenPriceRate" },
            { label: "Total Price", key: "priceAmount" },
            { label: "Time", key: "timestamp" },
          ]}
          sortKey={orderBy}
          sortType={sortType}
          setSortKey={setOrderBy}
          setSortType={setSortType}
          className="ListedSort"
        />
        <List
          loading={loading}
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }}
          dataSource={list}
          renderItem={(item) => (
            <List.Item>
              <Card
                styles={{ body: { padding: 0 } }}
                hoverable
                className="orderCard mrc20OrderCard"
              >
                <div className="cardWrap">
                  <div className="contetn">
                    <div className="textContent">
                      <div className="amont">
                        <MRC20Icon
                          size={32}
                          metadata={metaData}
                          tick={item.tick}
                        />{" "}
                        {item.amountStr} {item.tick}
                      </div>
                      <div className="units">
                        <span className="colorPrimary">
                          <NumberFormat
                            value={item.tokenPriceRate}
                            isBig
                            decimal={8}
                            tiny
                            precision={12}
                          />
                        </span>{" "}
                        DOGE/{item.tick}
                      </div>
                    </div>
                  </div>

                  <div className="mrc20info">
                    <div className="token">
                      <div className="tokenName">#{item.tick}</div>
                      <div className="tokenId">
                        TokenID:{" "}
                        {item.tickId.replace(/(\w{4})\w+(\w{5})/, "$1...$2")}
                      </div>
                    </div>
                    <div className="sellerWrap">
                      <div className="seller">
                        <MetaIdAvatar
                          avatar={item.seller.avatar}
                          size={20}
                          style={{ minWidth: 20 }}
                        />
                        <div className="name">
                          {item.seller.name ||
                            item.sellerAddress.replace(
                              /(\w{5})\w+(\w{5})/,
                              "$1..."
                            )}
                        </div>
                      </div>
                      <div className="tokenId">
                        <Tooltip title={item.sellerAddress}>
                          Address :{" "}
                          {item.sellerAddress.replace(
                            /(\w{5})\w+(\w{5})/,
                            "$1..."
                          )}
                        </Tooltip>
                      </div>
                    </div>
                  </div>

                  <div className="price ">
                    <ChainIcon chain="doge" size={20} />
                    <span>
                      {formatSat(item.priceAmount)} DOGE{" "}
                      <USDPrice
                        value={item.priceAmount}
                        decimals={8}
                        chain="doge"
                      />
                    </span>
                  </div>

                  <div className="btn animation-slide-bottom">
                    {connected ? (
                      <Button
                        type="primary"
                        style={{ height: 40 }}
                        block
                        onClick={() => {
                          if (dogeAddress === item.sellerAddress) {
                            setCurOrder({ ...item, metaData: metaData });
                            setCancelModalVisible(true);
                          } else {
                            setCurOrder({ ...item, metaData: metaData });
                            setBuyModalVisible(true);
                          }
                        }}
                      >
                        {dogeAddress === item.sellerAddress ? (
                          <Trans>Cancel</Trans>
                        ) : (
                          <Trans>Buy</Trans>
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        style={{ height: 40 }}
                        block
                        onClick={connect}
                      >
                        <Trans>Connect</Trans>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
          pagination={{
            current: page + 1,
            pageSize: size,
            total: total,
            onChange: (p) => setPage(p - 1),
            showSizeChanger: false,
          }}
        />
      </div>

      <BuyDogeMrc20Modal
        order={curOrder}
        show={buyModalVisible}
        onClose={() => {
          setBuyModalVisible(false);
          setCurOrder(undefined);
          fetchOrders();
        }}
      />

      <CancelListing
        show={cancelModalVisible}
        submiting={cancelSubmiting}
        onClose={() => {
          setCancelModalVisible(false);
          setCurOrder(undefined);
        }}
        handleCancel={handleCancel}
      />
    </div>
  );
};

/**
 * Doge MRC-20 上架页面
 */
import {
  getIdCoinInfo,
  getMrc20AddressUtxo,
  getMrc20Info,
  sellMRC20Order,
} from "@/services/api";
import {
  Button,
  Card,
  ConfigProvider,
  InputNumber,
  List,
  Space,
  Typography,
  message,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useModel, useMatch, history } from "umi";
import "./index.less";
import { LeftOutlined, CheckOutlined, LoadingOutlined } from "@ant-design/icons";
import { formatSat } from "@/utils/utlis";
import SuccessModal, {
  DefaultSuccessProps,
  SuccessProps,
} from "@/components/SuccessModal";
import useIntervalAsync from "@/hooks/useIntervalAsync";
import MetaIdAvatar from "@/components/MetaIdAvatar";
import NumberFormat from "@/components/NumberFormat";
import MRC20Icon from "@/components/MRC20Icon";
import Decimal from "decimal.js";
import Trans from "@/components/Trans";
import ChainIcon from "@/components/ChainIcon";
import USDPrice from "@/components/USDPrice";
import { getDogeSource, DOGE_SATS_PER_COIN } from "@/utils/doge";
import { listDogeMrc20Order } from "@/utils/dogeMrc20";
import { DOGE_PRICE_USD } from "@/config";

// 扩展的 UTXO 类型，包含 MRC20 信息
type DogeListItem = API.Mrc20AddressUtxo & API.Mrc20AddressUtxo["mrc20s"][0];

export default () => {
  const { dogeAddress, connect, connected, network, dogeAuthParams, dogePrice } =
    useModel("wallet");
  const match = useMatch("/list-doge/:assetType/:tick");
  const [idCoin, setIdCoin] = useState<API.IdCoin | API.MRC20TickInfo>();
  const [loading, setLoading] = useState<boolean>(true);
  const [list, setList] = useState<DogeListItem[]>([]);

  const [successProp, setSuccessProp] =
    useState<SuccessProps>(DefaultSuccessProps);

  const [checkList, setCheckList] = useState<string[]>([]);
  const [sellPrices, setSellPrices] = useState<Record<string, number>>({});
  const [submiting, setSubmiting] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    if (!match || !match.params.tick) return;
    const params: any = {
      tick: match.params.tick,
      source: getDogeSource(),
    };
    if (match.params.assetType === "idCoins") {
      const { data } = await getIdCoinInfo(network, params);
      setIdCoin(data);
    } else {
      const { data } = await getMrc20Info(network, params);
      setIdCoin(data);
    }
  }, [match, network]);

  const fetchUserUtxo = useCallback(async () => {
    try {
      if (!idCoin || !dogeAddress)
        throw new Error("no idCoin or dogeAddress");
      const { data: utxoList, code } = await getMrc20AddressUtxo(
        network,
        {
          address: dogeAddress,
          tickId: idCoin.mrc20Id,
          cursor: 0,
          size: 100,
          source: getDogeSource(),
        },
        {
          headers: {
            ...dogeAuthParams,
          },
        }
      );
      const _list: any = [];
      if (code === 0) {
        utxoList.list.forEach((item) => {
          if (item.orderId === "") {
            item.mrc20s.forEach((mrc20) => {
              _list.push({
                ...item,
                ...mrc20,
              });
            });
          }
        });
      }
      setList(_list);
      setLoading(false);
    } catch (err) {}
    setLoading(false);
  }, [dogeAddress, network, dogeAuthParams, idCoin]);

  const balance = useMemo(() => {
    if (!list) return 0;
    return list.reduce((prev, curr) => {
      return prev + Number(curr.amount);
    }, 0);
  }, [list]);

  useEffect(() => {
    fetchUserUtxo();
  }, [fetchUserUtxo]);

  const update = useIntervalAsync(fetchData, 100000);

  // 计算 USD 价格
  const getUsdValue = (dogeAmount: number) => {
    return new Decimal(dogeAmount).mul(dogePrice || DOGE_PRICE_USD).toFixed(2);
  };

  const handleList = async () => {
    if (!dogeAddress || !idCoin || checkList.length === 0) return;
    setSubmiting(true);
    try {
      for (const txPoint of checkList) {
        const price = sellPrices[txPoint];
        if (!price || price <= 0) {
          throw new Error(`Please set price for ${txPoint}`);
        }
        // 找到对应的 UTXO
        const item = list.find((i) => i.txPoint === txPoint);
        if (!item) continue;

        const [txId, voutStr] = txPoint.split(":");
        const utxo: API.UTXO = {
          txId,
          vout: Number(voutStr),
          outputIndex: Number(voutStr),
          satoshi: item.satoshi || 1000000, // Doge 默认值
          satoshis: item.satoshis || 1000000,
          confirmed: true,
        };

        // 价格转换为 satoshis
        const priceInSats = Number(
          new Decimal(price).times(DOGE_SATS_PER_COIN).toFixed(0)
        );

        // 创建上架 PSBT
        const psbtRaw = await listDogeMrc20Order(
          utxo,
          priceInSats,
          network,
          dogeAddress
        );

        // 提交到服务器
        const { code, message: msg } = await sellMRC20Order(
          network,
          {
            assetType: "mrc20",
            tickId: idCoin.mrc20Id,
            address: dogeAddress,
            psbtRaw,
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
          throw new Error(msg);
        }
      }

      message.success(<Trans>Listed successfully!</Trans>);
      setSuccessProp({
        show: true,
        onClose: () => {
          setSuccessProp(DefaultSuccessProps);
          history.push(`/doge-mrc20/${idCoin.mrc20Id}`);
        },
        onDown: () => {
          setSuccessProp(DefaultSuccessProps);
          history.push(`/doge-mrc20/${idCoin.mrc20Id}`);
        },
        title: <Trans>List</Trans>,
        tip: <Trans>Listed Successfully</Trans>,
        children: (
          <div>
            <p>
              {checkList.length} item(s) listed for sale
            </p>
          </div>
        ),
      });
      setCheckList([]);
      setSellPrices({});
      fetchUserUtxo();
    } catch (err: any) {
      message.error(err.message);
    }
    setSubmiting(false);
  };

  return (
    <div className="listIdCoinPage">
      <div
        className="pageBack"
        onClick={() => {
          history.back();
        }}
      >
        <LeftOutlined />
        <Trans>Back</Trans>
      </div>

      {idCoin && (
        <div className="tokenInfo">
          <div className="tokenInfoWrap">
            <div className="baseInfo">
              <MRC20Icon
                size={64}
                tick={idCoin.tick}
                metadata={idCoin.metaData}
              />
              <div className="tickInfo">
                <div className="tick">
                  <Space>
                    <ChainIcon chain="doge" size={24} />
                    <span>#{idCoin.tick}</span>
                  </Space>
                </div>
                <div className="balance">
                  <Trans>Balance</Trans>: <NumberFormat value={balance} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="listContent">
        <Typography.Title level={4}>
          <Trans>Select items to list</Trans>
        </Typography.Title>

        <List
          loading={loading}
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
          dataSource={list}
          renderItem={(item: any) => (
            <List.Item>
              <Card
                hoverable
                className={`listCard ${
                  checkList.includes(item.txPoint) ? "selected" : ""
                }`}
                onClick={() => {
                  if (checkList.includes(item.txPoint)) {
                    setCheckList(checkList.filter((i) => i !== item.txPoint));
                  } else {
                    setCheckList([...checkList, item.txPoint]);
                  }
                }}
              >
                <div className="cardContent">
                  <div className="amount">
                    <NumberFormat value={item.amount} /> {item.tick}
                  </div>
                  <div className="txPoint">
                    {item.txPoint.replace(/(\w{6})\w+(\w{4})/, "$1...$2")}
                  </div>
                  {checkList.includes(item.txPoint) && (
                    <div className="priceInput" onClick={(e) => e.stopPropagation()}>
                      <InputNumber
                        placeholder="Price in DOGE"
                        min={0.001}
                        step={0.1}
                        value={sellPrices[item.txPoint]}
                        onChange={(value) => {
                          setSellPrices({
                            ...sellPrices,
                            [item.txPoint]: value || 0,
                          });
                        }}
                        addonAfter="DOGE"
                        style={{ width: "100%" }}
                      />
                      {sellPrices[item.txPoint] > 0 && (
                        <div className="usdValue">
                          ≈ ${getUsdValue(sellPrices[item.txPoint])} USD
                        </div>
                      )}
                    </div>
                  )}
                  {checkList.includes(item.txPoint) && (
                    <div className="checkIcon">
                      <CheckOutlined />
                    </div>
                  )}
                </div>
              </Card>
            </List.Item>
          )}
        />

        {checkList.length > 0 && (
          <div className="listActions">
            <Button
              type="primary"
              size="large"
              loading={submiting}
              onClick={handleList}
              disabled={
                checkList.some((txPoint) => !sellPrices[txPoint] || sellPrices[txPoint] <= 0)
              }
            >
              <Trans>List</Trans> {checkList.length} item(s)
            </Button>
          </div>
        )}
      </div>

      <SuccessModal {...successProp} />
    </div>
  );
};

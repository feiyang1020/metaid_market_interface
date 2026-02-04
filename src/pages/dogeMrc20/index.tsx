/**
 * Doge MRC-20 Token 详情页面
 * 支持查看、上架（List）和购买（Buy）Doge 链上的 MRC-20 代币
 */
import useIntervalAsync from "@/hooks/useIntervalAsync";
import { getMrc20AddressUtxo, getMrc20Info } from "@/services/api";
import {
  Avatar,
  Button,
  ConfigProvider,
  Divider,
  Progress,
  Statistic,
  Tabs,
  TabsProps,
  Typography,
  Grid,
  Space,
  Popover,
  message,
} from "antd";
import { useCallback, useEffect, useState } from "react";
import { useMatch, useModel, history } from "umi";
import "./index.less";
import DogeListed from "./components/Listed";
import NumberFormat from "@/components/NumberFormat";
import {
  LeftOutlined,
  LinkOutlined,
  RightOutlined,
  ShareAltOutlined,
  XOutlined,
} from "@ant-design/icons";
import DogeActivity from "./components/Activity";
import DogeMyActivity from "./components/MyActivity";
import MetaIdAvatar from "@/components/MetaIdAvatar";
import MRC20Icon from "@/components/MRC20Icon";
import { formatSat } from "@/utils/utlis";
import ChainIcon from "@/components/ChainIcon";
import copy from "copy-to-clipboard";
import Trans from "@/components/Trans";
import USDPrice from "@/components/USDPrice";
import { getDogeSource } from "@/utils/doge";

const { useBreakpoint } = Grid;

const items: TabsProps["items"] = [
  {
    key: "1",
    label: "Listed",
    children: "Content of Tab Pane 1",
  },
  {
    key: "2",
    label: "Activity",
    children: "Content of Tab Pane 2",
  },
  {
    key: "3",
    label: "My Activity",
    children: "Content of Tab Pane 3",
  },
];

export default () => {
  const screens = useBreakpoint();
  const match = useMatch("/doge-mrc20/:mrc20Id");
  const { network, dogeAddress, dogeAuthParams, connected } = useModel("wallet");
  const [mrc20Info, setMrc20Info] = useState<API.MRC20Info>();
  const [showListBtn, setShowListBtn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = useCallback(async () => {
    if (!match || !match.params.mrc20Id) return;
    const params: any = {
      source: getDogeSource(), // Doge 链需要 source 参数
    };
    if (match.params.mrc20Id.length > 24) {
      params.tickId = match.params.mrc20Id;
    } else {
      params.tick = match.params.mrc20Id;
    }
    const { data } = await getMrc20Info(network, params);
    setMrc20Info(data);
  }, [match, network]);

  const update = useIntervalAsync(fetchData, 100000);

  const fetchUserUtxo = useCallback(async () => {
    try {
      if (!mrc20Info || !dogeAddress)
        throw new Error("no MRC20 or dogeAddress");
      const { data: utxoList, code } = await getMrc20AddressUtxo(
        network,
        {
          address: dogeAddress,
          tickId: mrc20Info.mrc20Id,
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
      let _showListBtn = false;
      if (code === 0) {
        const find = utxoList.list.find((item) => {
          return item.orderId === "" && item.mrc20s.length > 0;
        });
        if (find) {
          _showListBtn = true;
        }
      }
      setShowListBtn(_showListBtn);
    } catch (err) {}
    setLoading(false);
  }, [dogeAddress, network, dogeAuthParams, mrc20Info]);

  useEffect(() => {
    fetchUserUtxo();
  }, [fetchUserUtxo]);

  const shareX = () => {
    const shareText = `I found an interesting Doge MRC-20 Token! Check out ${mrc20Info?.tick}: ${window.location.href}`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}`;
    window.open(shareUrl, "_blank");
  };

  const copyLink = () => {
    copy(window.location.href);
    message.success(<Trans>Link copied to clipboard</Trans>);
  };

  return (
    <div className="mrc20Page dogeMrc20Page">
      <div
        className="pageBack"
        onClick={() => {
          history.back();
        }}
      >
        <LeftOutlined />
        <Trans>Back</Trans>
      </div>
      {mrc20Info && (
        <div className="tokenInfo">
          <div className="tokenInfoWrap">
            <div className="baseInfo">
              <MRC20Icon
                size={screens.md ? 84 : 64}
                tick={mrc20Info.tick}
                metadata={mrc20Info.metaData}
              />
              <div className="tickInfo">
                <div className="tick">
                  <Space>
                    <ChainIcon chain="doge" size={24} />
                    <span>#{mrc20Info.tick}</span>
                  </Space>
                </div>
                <div className="tickId">
                  TokenID: {mrc20Info.mrc20Id.replace(/(\w{6})\w+(\w{5})/, "$1...$2")}
                </div>
                <div className="deployer">
                  <span className="label">
                    <Trans>Deployer</Trans>:
                  </span>
                  <MetaIdAvatar
                    size={20}
                    avatar={mrc20Info.deployerUserInfo?.avatar}
                  />
                  <span className="name">
                    {mrc20Info.deployerUserInfo?.name ||
                      mrc20Info.deployerAddress?.replace(
                        /(\w{5})\w+(\w{3})/,
                        "$1...$2"
                      )}
                  </span>
                </div>
              </div>
            </div>
            <div className="opBtns">
              <Button
                className="opBtn"
                type="text"
                icon={<XOutlined />}
                onClick={shareX}
              />
              <Button
                className="opBtn"
                type="text"
                icon={<LinkOutlined />}
                onClick={copyLink}
              />
            </div>
          </div>

          <div className="tokenStatistic">
            <Statistic
              className="statisticItem"
              title={<Trans>Total Supply</Trans>}
              value={mrc20Info.totalSupply}
            />
            <Statistic
              className="statisticItem"
              title={<Trans>Minted</Trans>}
              value={mrc20Info.totalMinted}
            />
            <Statistic
              className="statisticItem"
              title={<Trans>Holders</Trans>}
              value={mrc20Info.holders}
            />
            <Statistic
              className="statisticItem"
              title={<Trans>Transactions</Trans>}
              value={mrc20Info.txCount}
            />
          </div>

          <div className="mintProgress">
            <div className="progressLabel">
              <span>
                <Trans>Mint Progress</Trans>
              </span>
              <span>
                {mrc20Info.totalMinted} / {mrc20Info.totalSupply}
              </span>
            </div>
            <Progress
              percent={
                (Number(mrc20Info.totalMinted) / Number(mrc20Info.totalSupply)) *
                100
              }
              showInfo={false}
              strokeColor="#D4F66B"
            />
          </div>

          {showListBtn && !loading && (
            <div className="listBtnWrap">
              <Button
                type="primary"
                onClick={() =>
                  history.push(`/list-doge/mrc20/${mrc20Info.tick}`)
                }
              >
                <Trans>List</Trans>
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfigProvider
        theme={{
          components: {
            Tabs: {
              inkBarColor: "#D4F66B",
              itemActiveColor: "#D4F66B",
              itemSelectedColor: "#D4F66B",
              itemHoverColor: "#D4F66B",
            },
          },
        }}
      >
        <Tabs
          defaultActiveKey="1"
          items={items.map((item) => {
            if (item.key === "1") {
              return {
                ...item,
                children: mrc20Info ? (
                  <DogeListed
                    mrc20Id={mrc20Info.mrc20Id}
                    metaData={mrc20Info.metaData}
                  />
                ) : null,
              };
            }
            if (item.key === "2") {
              return {
                ...item,
                children: mrc20Info ? (
                  <DogeActivity mrc20Id={mrc20Info.mrc20Id} />
                ) : null,
              };
            }
            if (item.key === "3") {
              return {
                ...item,
                children: mrc20Info ? (
                  <DogeMyActivity mrc20Id={mrc20Info.mrc20Id} />
                ) : null,
              };
            }
            return item;
          })}
        />
      </ConfigProvider>
    </div>
  );
};

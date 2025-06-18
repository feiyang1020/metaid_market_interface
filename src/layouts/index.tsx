import { Link, Outlet, history, useLocation, useModel } from "umi";
import "./index.less";
import logo from "@/assets/logo.svg";
import defaultAvatar from "@/assets/avatar.svg";
import Nav from "./components/Nav";
import {
  Alert,
  Avatar,
  Button,
  ConfigProvider,
  Divider,
  Dropdown,
  DropdownProps,
  Space,
  Spin,
  message,
  theme,
} from "antd";
import {
  ArrowRightOutlined,
  DownOutlined,
  EditOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import SetProfile from "@/components/SetProfile";
import NumberFormat from "@/components/NumberFormat";
import SetFeeRate from "@/components/SetFeeRate";
import { StyleProvider } from '@ant-design/cssinjs';
import Trans from "@/components/Trans";
import SelectLang from "./components/SelectLang";

const _themes = {
  token: {
    colorPrimary: "#d4f66b",
    colorInfo: "#d4f66b",
    fontFamily: "HarmonyOS Sans",
  },
  components: {
    Button: {
      primaryColor: "rgb(0, 0, 0)",
      colorTextLightSolid: "rgb(0, 0, 0)",
    },
    Table: {
      colorBgContainer: "rgb(0, 0, 0)",
      controlItemBgActive: "rgb(0, 0, 0)",
      headerBg: "rgb(0, 0, 0)",
      colorText: "rgb(255, 255, 255)",
      colorLink: "rgb(255, 255, 255)",
      borderColor: "rgb(0, 0, 0)",
      headerSplitColor: "rgba(255, 251, 251, 0.08)",
      headerColor: "rgba(255, 255, 255, 0.6)",
    },
    "Input": {

      "colorSplit": "rgba(253, 253, 253, 0)"
    },
    "Progress": {
      "colorSuccess": "#d4f66b"
    },
    "Card": {
      "colorBgContainer": "rgba(25, 27, 24, 0.84)"
    },
    "Alert": {
      "colorErrorBorder": "rgb(255,82,82)"
    }
  },
};

export default function Layout() {
  const {
    connect,
    connected,
    metaid,
    userName,
    btcAddress,
    userBal,
    avatar,
    disConnect,
    feeRate,
    feeRateType,
    setFeeRateModelVisible,
    network,
    initializing
  } = useModel("wallet");
  const { pathname } = useLocation();
  const [editViseble, setEditVisible] = useState<boolean>(false)
  const [open, setOpen] = useState(false);
  const handleOpenChange: DropdownProps['onOpenChange'] = (nextOpen, info) => {
    if (info.source === 'trigger' || nextOpen) {
      setOpen(nextOpen);
    }
  };
  const handleMenuClick: MenuProps['onClick'] = (e) => {
    setOpen(!open);
  };
  useEffect(() => {
    if (pathname) {  // 可以排除不需要置顶的页面
      if (document?.documentElement || document?.body) {
        document.documentElement.scrollTop = document.body.scrollTop = 0;  // 切换路由时手动置顶
      }
    }
  }, [pathname]);
  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          ..._themes,
        }}
      >{network === 'testnet' && <Alert type="error" message={<Trans>This is a test network. Coins have no value.</Trans>} banner showIcon={false} style={{ textAlign: 'center' }} />}
        <div className="page">

          <div className="header">
            <div className="pageLeft">
              <img
                src={logo}
                alt=""
                className="logo"
                onClick={() => history.push("/")}
              />
              <Divider type="vertical"></Divider>
              <div className="navWrap">
                <Nav />
              </div>

            </div>
            <Spin spinning={initializing}>
              <div className="navWrap">
                {connected ? (
                  <Space align='center'>
                    <Button
                      type="link"
                      onClick={() => {
                        history.push("/sale");
                      }}
                      className="listforsale"
                    >
                      <Trans>List For Sale</Trans>
                    </Button>
                    <div className="feerate" style={{ display: "flex", alignItems: 'center', gap: 4, fontSize: 14, cursor: 'pointer' }} onClick={() => {
                      setFeeRateModelVisible(true)
                    }}>
                      <div className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4F66B' }}></div>
                      <div>
                        Gas <span className="colorPrimary"><NumberFormat prefix={<Trans>{feeRateType}</Trans>} value={feeRate} /> </span>
                      </div>
                    </div>
                    <Dropdown
                      arrow
                      dropdownRender={() => (
                        <div className="walletInfo" onClick={(e) => { e.stopPropagation(); handleMenuClick(e) }}>
                          <div className="userInfo">
                            <Avatar
                              src={
                                <img src={avatar || defaultAvatar} alt="avatar" />
                              }
                              style={{ minWidth: 46, minHeight: 46 }}
                            ></Avatar>
                            <div className="nameWrap">
                              <div className="name">
                                {userName ||
                                  (btcAddress &&
                                    btcAddress.replace(
                                      /(\w{4})\w+(\w{3})/,
                                      "$1...$2"
                                    ))}

                              </div>
                              {metaid && (
                                <div className="metaId">
                                  MetaID:
                                  {metaid.replace(/(\w{6})\w+(\w{3})/, "$1...")}
                                </div>
                              )}
                            </div>
                            <Button size="small" icon={<EditOutlined />} type="link" onClick={() => setEditVisible(true)}>

                            </Button>
                          </div>
                          <div className="links">
                            <div
                              className="item forsale"
                              onClick={() => {
                                history.push("/sale");
                              }}
                            >
                              <div className="path"><Trans>List For Sale</Trans></div>
                              <RightOutlined />
                            </div>
                            <div
                              className="item"
                              onClick={() => {
                                history.push("/history");
                              }}
                            >
                              <div className="path"><Trans>Transaction History</Trans></div>
                              <RightOutlined />
                            </div>
                            <div
                              className="item"
                              onClick={() => {
                                history.push("/pending");
                              }}
                            >
                              <div className="path"><Trans>My Listing</Trans> </div>
                              <RightOutlined />
                            </div>
                            <div
                              className="item"
                              onClick={() => {
                                history.push("/mrc20History");
                              }}
                            >
                              <div className="path"><Trans>My MRC-20</Trans></div>
                              <RightOutlined />
                            </div>
                          </div>
                          <div className="disConnect" onClick={disConnect}>
                            <Trans>Disconnect</Trans>
                          </div>
                        </div>
                      )}
                      placement="bottomRight"
                      open={open}
                      onOpenChange={handleOpenChange}
                    >
                      <div className="userInfo" onClick={handleMenuClick}>

                        <Divider type='vertical' style={{ margin: 0 }} />
                        <div className="bal"> <NumberFormat value={userBal} precision={4} suffix=' BTC' /></div>
                        <Avatar
                          style={{ minWidth: 30, minHeight: 30 }}
                          src={<img src={avatar || defaultAvatar} alt="avatar" />}
                        ></Avatar>
                        <DownOutlined />
                      </div>
                    </Dropdown>
                  </Space>
                ) : (
                  <Button type="primary" onClick={connect}>
                    <Trans>Connect</Trans>
                  </Button>
                )}
                <SelectLang />
              </div>
            </Spin>
          </div>

          <div className="content">
            <Outlet />
          </div>

          <div className="footer">
            <span>MetaID.market@2024 All Rights Reserved</span>
            <span>
              <Link style={{ textDecoration: 'underline', color: '#fff' }} to="/about/fees" >
                <Trans>About Fees</Trans> </Link>
            </span>
          </div>
          <SetProfile show={false} editVisible={editViseble} onClose={() => { setEditVisible(false) }} />
          <SetFeeRate />
        </div>

      </ConfigProvider>
    </StyleProvider>
  );
}

import { Link, Outlet, history, useLocation, useModel } from "umi";
import "./index.less";
import logo from "@/assets/logo.svg";
import defaultAvatar from "@/assets/avatar@2x.png";
import Nav from "./components/Nav";
import {
  Avatar,
  Button,
  ConfigProvider,
  Divider,
  Dropdown,
  Space,
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
  } = useModel("wallet");
  const { pathname } = useLocation();
  const [editViseble, setEditVisible] = useState<boolean>(false)
  useEffect(() => {
    if (pathname) {  // 可以排除不需要置顶的页面
      if (document?.documentElement || document?.body) {
        document.documentElement.scrollTop = document.body.scrollTop = 0;  // 切换路由时手动置顶
      }
    }
  }, [pathname]);
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        ..._themes,
      }}
    >
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
          <div className="navWrap">
            {connected ? (
              <Space>
                <Button
                  type="link"
                  onClick={() => {
                    history.push("/sale");
                  }}
                  className="listforsale"
                >
                  List for sale
                </Button>
                <Dropdown
                  arrow
                  dropdownRender={() => (
                    <div className="walletInfo">
                      <div className="userInfo">
                        <Avatar
                          src={
                            <img src={avatar || defaultAvatar} alt="avatar" />
                          }
                          style={{ width: 46, height: 46 }}
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
                          <div className="path">List for sale</div>
                          <RightOutlined />
                        </div>
                        <div
                          className="item"
                          onClick={() => {
                            history.push("/history");
                          }}
                        >
                          <div className="path">Transaction History</div>
                          <RightOutlined />
                        </div>
                        <div
                          className="item"
                          onClick={() => {
                            history.push("/pending");
                          }}
                        >
                          <div className="path">My Listing</div>
                          <RightOutlined />
                        </div>
                        <div
                          className="item"
                          onClick={() => {
                            history.push("/mrc20History");
                          }}
                        >
                          <div className="path">My MRC-20</div>
                          <RightOutlined />
                        </div>
                      </div>
                      <div className="disConnect" onClick={disConnect}>
                        Disconnect
                      </div>
                    </div>
                  )}
                  placement="bottomRight"
                >
                  <div className="userInfo">
                    <div className="bal">{userBal} BTC</div>
                    <Avatar
                      src={<img src={avatar || defaultAvatar} alt="avatar" />}
                    ></Avatar>
                    <DownOutlined />
                  </div>
                </Dropdown>
              </Space>
            ) : (
              <Button type="primary" onClick={connect}>
                Connect
              </Button>
            )}
          </div>
        </div>

        <div className="content">
          <Outlet />
        </div>

        <div className="footer">MetaID.market@2024 All Rights Reserved</div>
        <SetProfile show={false} editVisible={editViseble} onClose={() => { setEditVisible(false) }} />
      </div>

    </ConfigProvider>
  );
}

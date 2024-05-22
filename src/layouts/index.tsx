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
import { DownOutlined } from "@ant-design/icons";

const _themes = {
  token: {
    colorPrimary: "#d4f66b",
    colorInfo: "#d4f66b",
  },
  components: {
    Button: {
      primaryColor: "rgb(0, 0, 0)",
      colorTextLightSolid: "rgb(0, 0, 0)",
    },
  },
};

export default function Layout() {
  const { connect, connected, metaid, userBal, avatar, disConnect } =
    useModel("wallet");
  console.log(userBal, avatar);
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
                >
                  List for sale
                </Button>
                <Dropdown
                  dropdownRender={() => (
                    <div className="walletInfo">
                      <div className={`item active`} onClick={disConnect}>
                        <span className="name">Disconnect</span>
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
      </div>
    </ConfigProvider>
  );
}

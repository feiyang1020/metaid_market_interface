import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import React from "react";
import logo from "@/assets/logo.svg";
import "./global.less";

const antIcon = (
  <LoadingOutlined style={{ fontSize: 24, color: "#d4f66b" }} spin />
);

const App: React.FC = () => {
  // 暂时这样
  return (
    <div className="init_loading" style={{ background: "#000" }}>
      <img src={logo} alt="" className="logo" />
      <Spin indicator={antIcon} />
    </div>
  );
};

export default App;

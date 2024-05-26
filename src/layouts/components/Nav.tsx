import { Menu, MenuProps, Space } from "antd";
import { history, useLocation } from "umi";
import { HomeOutlined, EditOutlined } from "@ant-design/icons";
import { useState } from "react";
import home1 from "@/assets/home1.svg";
import home2 from "@/assets/home2.svg";
import inscribe1 from "@/assets/Inscribe1.svg";
import inscribe2 from "@/assets/Inscribe2.svg";
type MenuItem = Required<MenuProps>["items"][number];

const items = [
  {
    label: "Market",
    key: "/",
    icon: home2,
    activeIvon: home1,
  },
  {
    label: "Inscribe",
    key: "/inscribe",
    icon: inscribe1,
    activeIvon: inscribe2,
  },
];
export default () => {
  const location = useLocation();
  const path = location.pathname;
  const onClick = (key: string) => {
    history.push(key);
  };
  return (
    <Space className="navs">
      {items.map((item) => (
        <div
          onClick={() => onClick(item.key)}
          className={`nav ${path === item.key ? "active" : ""}`}
          key={item.key}
        >
          <img
            className="icon"
            src={path === item.key ? item.activeIvon : item.icon}
            alt=""
          />{" "}
          <span className="text">{item.label}</span>
        </div>
      ))}
    </Space>
  );
};

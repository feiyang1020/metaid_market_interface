import { Avatar } from "antd";
import defaultAvatar from "@/assets/avatar.svg";
import { getHostByNet } from "@/config";
import { useModel } from "umi";
import React from "react";
type Props = {
  avatar: string;
  style?: React.CSSProperties;
  size?: number;
};
export default ({ avatar, style, size }: Props) => {
  const { network } = useModel("wallet");
  return (
    <Avatar
      style={{ ...style }}
      size={size}
      src={
        <img
          src={avatar ? avatar.indexOf('http') > -1 ? avatar : getHostByNet(network) + avatar : defaultAvatar
          }
          alt="avatar"
        />
      }
    ></Avatar >
  );
};

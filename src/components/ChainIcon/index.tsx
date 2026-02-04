import { Typography } from "antd";
import btcIcon from "@/assets/logo_btc@2x.png";
// 暂时使用 BTC 图标的样式，之后可以替换为 Doge 图标
// import dogeIcon from "@/assets/logo_doge@2x.png";

type Props = {
  chain?: API.Chain;
  size?: number;
  showSymbol?: boolean;
};

// Doge 图标使用 SVG 内联，之后可以替换为图片
const DogeIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ verticalAlign: "middle" }}
  >
    <circle cx="16" cy="16" r="16" fill="#C2A633" />
    <path
      d="M13.5 8H18.5C22.5 8 25 10.5 25 14V18C25 21.5 22.5 24 18.5 24H13.5C11 24 9 22 9 19.5V12.5C9 10 11 8 13.5 8Z"
      fill="white"
    />
    <path
      d="M13 12H17C19.2 12 21 13.8 21 16C21 18.2 19.2 20 17 20H13V12Z"
      fill="#C2A633"
    />
    <rect x="11" y="15" width="8" height="2" fill="white" />
  </svg>
);

export default ({ chain = "btc", size = 20, showSymbol = false }: Props) => {
  if (chain === "doge") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <DogeIcon size={size} />
        {showSymbol && (
          <Typography.Text style={{ fontSize: size * 0.7 }}>DOGE</Typography.Text>
        )}
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <img
        src={btcIcon}
        alt="BTC"
        style={{ width: size, height: size, verticalAlign: "middle" }}
      />
      {showSymbol && (
        <Typography.Text style={{ fontSize: size * 0.7 }}>BTC</Typography.Text>
      )}
    </span>
  );
};

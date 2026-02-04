import { Radio, Space } from "antd";
import { useModel } from "umi";
import ChainIcon from "../ChainIcon";

type Props = {
  value: API.Chain;
  onChange: (chain: API.Chain) => void;
  showDoge?: boolean;
};

export default ({ value, onChange, showDoge = true }: Props) => {
  const { dogeAddress } = useModel("wallet");

  // 如果没有 Doge 地址，不显示切换器
  if (!showDoge || !dogeAddress) {
    return null;
  }

  return (
    <Radio.Group
      value={value}
      onChange={(e) => onChange(e.target.value)}
      buttonStyle="solid"
      size="small"
    >
      <Radio.Button value="btc">
        <Space size={4}>
          <ChainIcon chain="btc" size={16} />
          <span>BTC</span>
        </Space>
      </Radio.Button>
      <Radio.Button value="doge">
        <Space size={4}>
          <ChainIcon chain="doge" size={16} />
          <span>DOGE</span>
        </Space>
      </Radio.Button>
    </Radio.Group>
  );
};

import { CaretDownOutlined, CaretUpOutlined } from "@ant-design/icons";
import './index.less'
type Props = {
  status: "down" | "up" | undefined;
};
export default ({ status }: Props) => {
  return (
    <div className="sortArrow">
      <CaretUpOutlined
        style={{
          color: status === "up" ? "#D4F66B" : "rgba(255, 255, 255, 0.15)",
        }}
      />
      <CaretDownOutlined
        style={{
          color: status === "down" ? "#D4F66B" : "rgba(255, 255, 255, 0.15)",
          marginTop:-4
        }}
      />
    </div>
  );
};

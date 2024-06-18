import { Col, InputNumber, Row } from "antd";
import { useEffect, useState } from "react";

type FeeRateProps = {
  feeRates: any[];
  value: number;
  onChange: (value: number) => void;
};

const SeleceFeeRateItem = ({
  feeRates,
  onChange,
}: FeeRateProps) => {
  const [customRate, setCustomRate] = useState<string | number>(0);
  const [feeRateTab, setFeeRateTab] = useState<string>("Avg");
  useEffect(() => {
    if (feeRateTab !== "custom") {
      const find = feeRates.find((item) => item.label === feeRateTab);
      if (find){
        onChange(find.value);
        return;
      } 
      onChange(0);
    } else {
      return onChange(Number(customRate) || 0);
    }
  }, [feeRateTab, customRate, feeRates])
  return (
    <div className="FeeRateWrap">
      <Row gutter={[12, 12]}>
        {feeRates.map((item) => (
          <Col
            span={8}
            onClick={() => setFeeRateTab(item.label)}
            key={item.label}
          >
            <div
              className={`feeRateItem ${item.label === feeRateTab ? "active" : ""
                }`}
            >
              <div className="Feelabel">{item.label}</div>
              <div className="Feevalue">{item.value} sat/vB</div>
              <div className="Feetime">{item.time}</div>
            </div>
          </Col>
        ))}
      </Row>
      <Row
        className={`custom ${"custom" === feeRateTab ? "active" : ""}`}
        onClick={() => {
          setFeeRateTab("custom");
        }}
      >
        <Col span={24} style={{ textAlign: "left" }}>
          Customize fee rate
        </Col>
        <Col span={24} style={{ textAlign: "left" }}>
          <InputNumber
            value={customRate}
            onChange={setCustomRate}
            style={{ width: "80px", textAlign: "right" }}
            className="customInput"
            variant="borderless"
            controls={false}
          />
          sat/vB
        </Col>
      </Row>
    </div>
  );
};

export default SeleceFeeRateItem;
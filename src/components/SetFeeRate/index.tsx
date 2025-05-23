import { useModel } from "umi";
import Popup from "../ResponPopup";
import NumberFormat from "../NumberFormat";
import { Col, Divider, InputNumber, Row } from "antd";
import { useCallback, useEffect, useState } from "react";
import "./index.less";
import { CheckOutlined } from "@ant-design/icons";
import cus from '@/assets/icons/gauge-low.svg'
import Actcus from '@/assets/icons/gauge-low (1).svg'
import { getMinFeeRate } from "@/utils/mempool";
import Trans from "../Trans";
export default () => {
    const { feeRate, feeRateType, feeRates, setFeeRate, setFeeRateModelVisible, setFeeRateType, feeRateModalVisible, network } = useModel("wallet");
    const [minFeeRate, setMinFeeRate] = useState<number>(1);


    const [customRate, setCustomRate] = useState<string | number>(1);
    const _getMinFeeRate = useCallback(async () => {
        const _minFeeRate = await getMinFeeRate(network);
        setMinFeeRate(_minFeeRate);
        setCustomRate(prev => {
            if (Number(prev) < _minFeeRate) {
                return _minFeeRate
            }
            return prev
        })
    }, [network])
    useEffect(() => {
        _getMinFeeRate()
    }, [_getMinFeeRate])
    useEffect(() => {
        if (feeRateType === "Custom") {
            setFeeRate(Number(customRate) || 1);
        }
    }, [feeRateType, customRate])
    return <Popup
        show={feeRateModalVisible}
        onClose={() => setFeeRateModelVisible(false)}
        title={<Trans>Gas</Trans>}
        closable={true}
    >
        <div className="feeModal">
            <div className="title">
                <div className="curfeeRate colorPrimary">
                    <NumberFormat value={feeRate} suffix=' sat/vB' />
                </div>

                <div>
                   <Trans>Current Gas Fee</Trans> 
                </div>
            </div>
            <Divider></Divider>
            <div className="label">
                <Trans>Choose Gas Plan</Trans>
                
            </div>

            <div className="FeeRateWrap">
                <Row gutter={[16, 16]} className="options">
                    {feeRates.map((item) => (
                        <Col
                            span={24}
                            onClick={() => { setFeeRateType(item.label); setFeeRate(item.value) }}
                            key={item.label}
                        >
                            <div
                                className={`feeRateItem ${item.label === feeRateType ? "active" : ""
                                    }`}
                            >
                                <div>
                                    <div className="Feelabel"><img src={item.label === feeRateType ? item.activeIcon : item.icon}></img> <Trans>{item.label}</Trans></div>
                                    <div className="Feevalue">{item.value} sat/vB</div>
                                </div>

                                <div className="checked">
                                    <CheckOutlined style={{ color: '#d4f66b', fontSize: 12 }} />
                                </div>
                            </div>
                        </Col>
                    ))}
                    <Col span={24}

                        onClick={() => {
                            setFeeRateType("Custom");
                        }}
                    >
                        <div
                            className={`feeRateItem ${'Custom' === feeRateType ? "active" : ""
                                }`}
                        >
                            <div>
                                <div className="Feelabel"><img src={'Custom' === feeRateType ? Actcus : cus}></img> <Trans>Custom</Trans></div>
                                <div className="Feevalue">
                                    <InputNumber
                                        value={customRate}
                                        onChange={setCustomRate}
                                        min={minFeeRate}
                                        style={{ width: '74px', background: '#28310C' }}
                                        className="customInput"
                                        variant="borderless"
                                        controls={false}
                                        precision={0}

                                    />
                                    {" "}sat/vB
                                </div>
                            </div>
                            <div className="checked">
                                <CheckOutlined style={{ color: '#d4f66b', fontSize: 12 }} />
                            </div>

                        </div>

                    </Col>
                </Row>

            </div>
        </div>
    </Popup>
}
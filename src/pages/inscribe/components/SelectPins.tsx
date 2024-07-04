import { ArrowRightOutlined } from "@ant-design/icons";
import { Checkbox, Col, Row } from "antd";

type Props = {
    shovel: API.MRC20Shovel[]
    onChange: (params: string[]) => void;
    value: string[];
    count: number;
    network: API.Network
}
export default ({ shovel, value, onChange, count, network }: Props) => {
    const handleOnchange = (_value: string[]) => {
        if (_value.length <= count) {
            onChange(_value)
        } else {
            onChange(_value.slice(-count))
        }

    }

    return <Checkbox.Group style={{ display: 'flex' }} value={value} onChange={handleOnchange}>
        <Row style={{ borderRadius: 8, overflow: 'hidden', maxHeight: 200, overflowY: 'scroll' }}>
            {shovel?.map(item => {
                return <Col span={24} key={item.id}>
                    <Checkbox className="customCheckbox" value={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row-reverse' }}>
                        <div className="value">
                            #{item.number}
                            <a href={`https://man${network === 'mainnet' ? '' : '-test'}.metaid.io/pin/${item.id}`} target='_blank'>
                                <ArrowRightOutlined style={{ color: 'rgba(255, 255, 255, 0.5)', transform: 'rotate(-0.125turn)' }} />
                            </a>
                        </div>
                    </Checkbox>
                </Col>
            })}

        </Row>
    </Checkbox.Group>
}
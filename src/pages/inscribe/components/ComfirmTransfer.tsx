import { useModel } from "umi";
import NumberFormat from "@/components/NumberFormat";
import Popup from "@/components/ResponPopup";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Col, Collapse, Divider, Row, Space, Tooltip, Typography } from "antd";
import './comfirmMintIdCoin.less'
export type TransferComfrimParams = {
    order: API.TransferMRC20PreRes,
    networkFeeRate: number,
    commitGas: number | string,
    recipient: string,
    amount: number | string,
    tick: API.UserMrc20Asset
}
type Props = {
    show: boolean
    onClose: () => void;
    submiting: boolean
    params?: TransferComfrimParams
    handleSubmit: () => Promise<void>
}

const DescItem = ({ label, value, dark, style = {} }: { label: React.ReactNode, dark?: boolean, value: React.ReactNode, style?: React.CSSProperties }) => {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 0', ...style }}>
        <div style={{ fontSize: '16px', color: dark ? 'rgba(255, 255, 255, 0.5)' : '#fff' }}>{label}</div>
        <div style={{ fontSize: '16px' }}>{value}</div>
    </div>
}
export default ({ show, onClose, params, submiting, handleSubmit }: Props) => {
    if (!params) return <></>
    const { userBal } =
        useModel("wallet");
    const items = [
        {
            key: 1,
            label: <DescItem
                dark
                style={{ padding: 0 }}
                label={<Space> Gas <Tooltip title="Gas = Commit Gas + Reveal Gas"> <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} /></Tooltip></Space>}
                value={<NumberFormat value={Number(params.commitGas) + Number(params.order.revealGas)} isBig decimal={8} minDig={8} suffix=' BTC' />}
            />,
            children: <div>
                <DescItem dark label="Commit Gas" value={<NumberFormat value={params.commitGas} isBig decimal={8} minDig={8} suffix=' BTC' />} />
                <DescItem dark label="Reveal  Gas" value={<NumberFormat value={params.order.revealGas} isBig decimal={8} minDig={8} suffix=' BTC' />} />

            </div>
        },
    ]

    return <Popup
        title="Confirm Transfer"
        modalWidth={452}
        show={show}
        onClose={onClose}
        closable={true}
        bodyStyle={{ padding: "28px 25px" }}
        className="mintModal">

        <div className="mintContent">
            <DescItem label="Ticker" value={<span style={{ fontWeight: 'bold' }}>{params.tick.tick}</span>} />
            <DescItem label="Amount" value={<NumberFormat value={params.amount} isBig precision={Number(params.tick.decimals)} />} />
            <DescItem label="Recipient Address" value={<Typography.Text  style={{ fontSize: '16px', color: '#fff' }} copyable={{ text: params.recipient }}>{params.recipient.replace(/(\w{4})\w+(\w{5})/, "$1...$2")}</Typography.Text>} />
            <Divider style={{ margin: '2px 0' }} />
            <Collapse ghost items={items} style={{ width: '100%' }} />
            <DescItem dark label="Service Fee" value={<NumberFormat value={params.order.serviceFee} isBig decimal={8} minDig={8} suffix=' BTC' />} />
            <Divider style={{ margin: '2px 0' }} />
            <DescItem label="You Will Spend" value={<NumberFormat value={params.order.totalFee + Number(params.commitGas) } isBig decimal={8} minDig={8} suffix=' BTC' />} />
            <DescItem label="Available Balance" value={<NumberFormat value={userBal} minDig={8} suffix=' BTC' />} />
            <Row gutter={[24, 24]} style={{ marginTop: 24, width: '80%' }}>
                <Col span={12}>
                    <Button size='large' type="link" block onClick={onClose}>Cancel</Button>
                </Col>
                <Col span={12}>
                    <Button size='large' type='primary' loading={submiting} block onClick={handleSubmit}>Confirm</Button>
                </Col>
            </Row>
        </div>

    </Popup>

}
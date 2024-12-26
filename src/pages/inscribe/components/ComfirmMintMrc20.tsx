import { useModel } from "umi";
import NumberFormat from "@/components/NumberFormat";
import Popup from "@/components/ResponPopup";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Col, Collapse, Divider, Row, Space, Tooltip, Typography } from "antd";
import './comfirmMintIdCoin.less'
import MRC20Icon from "@/components/MRC20Icon";
import Trans from "@/components/Trans";
export type MintMrc20ComfrimParams = {
    order: API.MintMRC20PreRes,
    commitGas: number | string,
    mrc20: API.MRC20TickInfo
}
type Props = {
    show: boolean
    onClose: () => void;
    submiting: boolean
    params?: MintMrc20ComfrimParams
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
                label={<Space> Gas <Tooltip title={<Trans>Gas = Commit Gas + Reveal Gas</Trans>}> <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} /></Tooltip></Space>}
                value={<NumberFormat value={Number(params.commitGas) + Number(params.order.revealGas)} isBig decimal={8} minDig={8} suffix=' BTC' />}
            />,
            children: <div>
                <DescItem dark label={<Trans>Commit Gas</Trans>} value={<NumberFormat value={params.commitGas} isBig decimal={8} minDig={8} suffix=' BTC' />} />
                <DescItem dark label={<Trans>Reveal Gas</Trans>} value={<NumberFormat value={params.order.revealGas} isBig decimal={8} minDig={8} suffix=' BTC' />} />

            </div>
        },
    ]

    return <Popup
        title={<Trans>Confirm Mint</Trans>}
        modalWidth={452}
        show={show}
        onClose={onClose}
        closable={true}
        bodyStyle={{ padding: "28px 25px" }}
        className="mintModal">
        <div className="mintContent">
            <div className="users">
                <div className='userAvatar'>
                    <MRC20Icon size={80} tick={params.mrc20.tick} metadata={params.mrc20.metaData} />
                </div>

                <div className="name"><span>{params.mrc20.tick}</span> {params.mrc20.tokenName && <span>({params.mrc20.tokenName}) </span>}</div>
                <div className="metaid"><Typography.Text className="token" copyable={{ text: params.mrc20.mrc20Id, }}>Token ID: {params.mrc20.mrc20Id.replace(/(\w{4})\w+(\w{5})/, "$1...$2")}</Typography.Text></div>
            </div>
            <Divider style={{ margin: '2px 0' }} />
            <Collapse ghost items={items} style={{ width: '100%' }} />
            <DescItem dark label={<Trans>Service Fee</Trans>} value={<NumberFormat value={params.order.serviceFee} isBig decimal={8} minDig={8} suffix=' BTC' />} />
            <Divider style={{ margin: '2px 0' }} />
            <DescItem label={<Trans>You Will Spend</Trans>} value={<NumberFormat value={params.order.totalFee + Number(params.commitGas) - Number(params.order.revealOutValue)} isBig decimal={8} minDig={8} suffix=' BTC' />} />
            <DescItem label={<Trans>Available Balance</Trans>} value={<NumberFormat value={userBal} minDig={8} suffix=' BTC' />} />
            <Row gutter={[24, 24]} style={{ marginTop: 24, width: '80%' }}>
                <Col span={12}>
                    <Button size='large' type="link" block onClick={onClose}>{<Trans>Cancel</Trans>}</Button>
                </Col>
                <Col span={12}>
                    <Button size='large' type='primary' loading={submiting} block onClick={handleSubmit}>{<Trans>Confirm</Trans>}</Button>
                </Col>
            </Row>
        </div>

    </Popup>

}
import MetaIdAvatar from "@/components/MetaIdAvatar";
import Popup from "@/components/ResponPopup"
import { useModel, useSearchParams, history } from "umi";
import './index.less'
import { Button, Col, Divider, Row } from "antd";
import NumberFormat from "@/components/NumberFormat";
type Props = {
    show: boolean
    onClose: () => void;
    fields?: Partial<{
        tick: string,
        followersNum: number,
        amountPerMint: number,
        liquidityPerMint: number,
        gasFee: number
    }>
    order: API.DeployIdCoinPreRes | undefined
    submiting?: boolean
    handleSubmit: () => Promise<void>
}
const DescItem = ({ label, value, dark }: { label: string, dark?: boolean, value: React.ReactNode }) => {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 0' }}>
        <div style={{ fontSize: '16px', color: dark ? 'rgba(255, 255, 255, 0.5)' : '#fff' }}>{label}</div>
        <div style={{ fontSize: '16px' }}>{value}</div>
    </div>
}
export default ({ show, onClose, fields = {}, order, submiting, handleSubmit }: Props) => {
    const { userBal, avatar, userName, metaid } =
        useModel("wallet");
    const { tick = '', followersNum = 0, amountPerMint = 0, liquidityPerMint = 0 } = fields
    if (!order) return <></>
    return <Popup
        title="Launch Me"
        modalWidth={452}
        show={show}
        onClose={onClose}
        closable={true}
        bodyStyle={{ padding: "28px 25px" }}
        className="launchModal">

        <div className="launchContent">
            <div className="users">
                <div className='userAvatar'>
                    <MetaIdAvatar avatar={avatar} size={60} />
                </div>

                <div className="name">{userName || 'Unnamed'}</div>
                <div className="metaid">Metaid:{metaid ? metaid.replace(/(\w{6})\w+(\w{3})/, "$1...") : '--'}</div>
            </div>
            <Divider />
            <DescItem label="Ticker" value={tick} />
            <DescItem label="Followers limit" value={<NumberFormat value={followersNum} />} />
            <DescItem label="Amount Per Mint" value={<NumberFormat value={amountPerMint} />} />
            <Divider style={{ margin: '2px 0' }} />
            <DescItem dark label="Liquidity Per Mint" value={<NumberFormat value={liquidityPerMint} isBig decimal={8} suffix=' BTC' />} />
            <DescItem dark label="Gas" value={<NumberFormat value={fields.gasFee} isBig decimal={8} suffix=' BTC' />} />
            <DescItem dark label="Service Fee" value={<NumberFormat value={order.totalFee} isBig decimal={8} suffix=' BTC' />} />
            <Divider style={{ margin: '2px 0' }} />
            <DescItem label="You will Spend" value={<NumberFormat value={Number(order.totalFee) + Number(fields.gasFee)} isBig decimal={8} suffix=' BTC' />} />
            <DescItem label="Available Balance" value={<NumberFormat value={userBal} suffix=' BTC' />} />
            <Row justify="center" gutter={[24, 24]} style={{ marginTop: 24, width: '80%' }}>
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
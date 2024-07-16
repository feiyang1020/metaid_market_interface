import MetaIdAvatar from "@/components/MetaIdAvatar";
import Popup from "@/components/ResponPopup"
import { useModel, useSearchParams, history } from "umi";
import './comfirmMintIdCoin.less'
import { Button, Col, Divider, Row } from "antd";
import NumberFormat from "@/components/NumberFormat";
type Props = {
    show: boolean
    onClose: () => void;
    idCoin: API.IdCoin | undefined
    order: API.MintIdCoinPreRes | undefined
    submiting?: boolean
    handleSubmit: () => Promise<void>
}
const DescItem = ({ label, value, dark }: { label: string, dark?: boolean, value: React.ReactNode }) => {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 0' }}>
        <div style={{ fontSize: '16px', color: dark ? 'rgba(255, 255, 255, 0.5)' : '#fff' }}>{label}</div>
        <div style={{ fontSize: '16px' }}>{value}</div>
    </div>
}
export default ({ show, onClose, idCoin, order, submiting, handleSubmit }: Props) => {
    const { userBal, avatar, userName, metaid } =
        useModel("wallet");

    if (!order || !idCoin) return <></>
    return <Popup
        title="Mint"
        modalWidth={452}
        show={show}
        onClose={onClose}
        closable={true}
        bodyStyle={{ padding: "28px 25px" }}
        className="mintModal">

        <div className="mintContent">
            <div className="users">
                <div className='userAvatar'>
                    <MetaIdAvatar avatar={idCoin.deployerUserInfo.avatar} size={60} />
                </div>

                <div className="name">{idCoin.deployerUserInfo.name || 'Unnamed'}</div>
                <div className="metaid">Metaid:{idCoin.deployerMetaId ? idCoin.deployerMetaId.replace(/(\w{6})\w+(\w{3})/, "$1...") : '--'}</div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <DescItem label="Ticker" value={idCoin.tick} />
            <DescItem label="Followers limit" value={<NumberFormat value={idCoin.followersLimit} />} />
            <DescItem label="Amount Per Mint" value={<NumberFormat value={idCoin.amtPerMint} />} />
            <DescItem label="Total Supply" value={<NumberFormat value={idCoin.totalSupply} />} />
            <DescItem label="Pool" value={<NumberFormat value={idCoin.pool} />} />
            <Divider style={{ margin: '2px 0' }} />
            <DescItem dark label="Liquidity Per Mint" value={<NumberFormat value={idCoin.liquidityPerMint} isBig decimal={8} suffix=' BTC' />} />
            <DescItem dark label="Gas" value={<NumberFormat value={order.revealInscribeFee + order.revealMintFee} isBig decimal={8} suffix=' BTC' />} />
            <DescItem dark label="Service Fee" value={<NumberFormat value={order.serviceFee} isBig decimal={8} suffix=' BTC' />} />
            <Divider style={{ margin: '2px 0' }} />
            <DescItem label="You will Spend" value={<NumberFormat value={order.totalFee} isBig decimal={8} suffix=' BTC' />} />
            <DescItem label="Available Balance" value={<NumberFormat value={userBal} suffix=' BTC' />} />
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
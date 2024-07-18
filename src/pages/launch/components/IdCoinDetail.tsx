import MetaIdAvatar from "@/components/MetaIdAvatar"
import NumberFormat from "@/components/NumberFormat"
import { Card, Col, Progress, Row, Statistic, Tooltip, Typography } from "antd"
import btcIcon from "@/assets/logo_btc@2x.png";
import './details.less'
import { formatSat } from "@/utils/utlis"
import IdCoinMessage from "@/components/IdCoinMessage";
type Props = {
    idCoid: API.IdCoin | undefined
}
const DescItem = ({ label, value, dark }: { label: string, dark?: boolean, value: React.ReactNode }) => {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0px 23px', lineHeight: '52px', background: 'rgba(25, 27, 24, 0.84)', borderRadius: 8 }}>
        <div style={{ fontSize: '16px', color: dark ? 'rgba(255, 255, 255, 0.5)' : '#fff' }}>{label}</div>
        <div style={{ fontSize: '16px' }}>{value}</div>
    </div>
}
export default ({ idCoid }: Props) => {
    if (!idCoid) return <></>
    return <Row gutter={[20, 20]} style={{ marginTop: 100, width: 784, maxWidth: 'calc(100vw - 24px)' }} className="idCoinDetails">
        <Col span={24}>
            <Card bordered={false} styles={{ body: { padding: '12px 23px' } }} >
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: "center" }}>
                    <MetaIdAvatar avatar={idCoid.deployerUserInfo.avatar} size={62} />
                    <div className="right" style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                            <div>
                                <Typography.Title level={4} style={{ margin: 0 }}>
                                    {idCoid.tick}
                                </Typography.Title>
                                <Typography.Text copyable={{ text: idCoid.deployerMetaId }} className="metaid"> MetaID: {idCoid.deployerMetaId.replace(/(\w{6})\w+(\w{5})/, "$1...")}</Typography.Text>
                            </div>
                            <div style={{ display: 'flex', gap: 4, justifyContent: "center", flexDirection: 'column', alignItems: "center" }}>
                                <Typography.Text className="ticker"><NumberFormat value={idCoid.followersCount} /> </Typography.Text>
                                <div>
                                    Followers
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                <div>
                    <div className="mint colorPrimary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                        <span>Minted : <NumberFormat value={idCoid.totalMinted} />  </span>
                        <span>Supply : <NumberFormat value={idCoid.totalSupply} /> </span>
                    </div>
                    <div className="slider" style={{ marginTop: 0 }}>
                        <Progress percent={Number(idCoid.supply / idCoid.totalSupply) * 100} showInfo={false} />
                    </div>
                    <div className="sliderNumber">

                        <NumberFormat value={(Number(idCoid.supply / idCoid.totalSupply) * 10) || 0} precision={4} suffix=' %' />
                    </div>
                </div>
            </Card>
        </Col>
        <Col span={24}>
            <Card bordered={false} >
                <Row gutter={[20, 20]}>
                    <Col xs={12} sm={12} md={6} lg={6} xl={6} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title="Total volume" value={formatSat(idCoid.totalVolume)} prefix={<img style={{ width: 16, height: 16 }} src={btcIcon}></img>} />
                    </Col>
                    <Col xs={12} sm={12} md={6} lg={6} xl={6} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title="Market Cap" value={formatSat(idCoid.marketCap)} prefix={<img style={{ width: 16, height: 16 }} src={btcIcon}></img>} />
                    </Col>
                    <Col xs={12} sm={12} md={6} lg={6} xl={6} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title="Floor price" formatter={()=><NumberFormat value={idCoid.floorPrice} isBig decimal={8} suffix=' BTC' />} />
                    </Col>
                    <Col xs={12} sm={12} md={6} lg={6} xl={6} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title="Holders" value={idCoid.holders} />
                    </Col>
                </Row>
            </Card>
        </Col>
        <Col md={12} xs={24} >
            <DescItem label="Ticker" value={idCoid.tick} />
        </Col>
        <Col md={12} xs={24} >
            <DescItem label="Followers limit" value={<NumberFormat value={idCoid.followersLimit} />} />
        </Col>
        <Col md={12} xs={24} >
            <DescItem label="Amount Per Mint" value={<NumberFormat value={idCoid.amtPerMint} />} />
        </Col>
        <Col md={12} xs={24} >
            <DescItem label="Liquidity Per Mint" value={<NumberFormat value={idCoid.liquidityPerMint} isBig decimal={8} suffix=' BTC' />} />
        </Col>
        <Col span={24} >
            <DescItem label="Message" value={<IdCoinMessage maxWidth={230} info={idCoid.metaData} />} />
        </Col>
    </Row >
}
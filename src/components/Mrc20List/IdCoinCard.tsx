import { Button, Card, Divider, Progress, Space, Tooltip } from "antd"
import MetaIdAvatar from "../MetaIdAvatar";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useModel, history } from "umi";
import NumberFormat from "../NumberFormat";
import './index.less'
type Props = {
    record: API.IdCoin
    showMintNotice: (record: API.IdCoin) => void;
    showTradeNotice: (record: API.IdCoin) => void;
    handleFollow: (record: API.IdCoin) => void;
}
export default ({ record, showMintNotice, showTradeNotice, handleFollow }: Props) => {
    const { network, btcAddress } = useModel('wallet')

    const percent = (Number(record.supply / record.totalSupply) * 100) || 0;
    return <Card className="IdCoinCard" bordered={false} style={{ background: '#101110', borderRadius: 16 }} styles={{ body: { padding: '12px 18px' } }} onClick={() => {
        history.push(`/idCoin/${record.tick}`)
    }} >
        <div className="top">
            <div className="topLeft">
                <MetaIdAvatar size={48} avatar={record.deployerUserInfo.avatar} />
                <div>
                    <div className="nameWrap">
                        <div className="name">
                            <Tooltip title={record.deployerUserInfo.name || record.deployerAddress}>{record.deployerUserInfo.name || record.deployerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}</Tooltip>
                        </div>
                        <a onClick={(e) => e.stopPropagation()} href={`${network === 'mainnet' ? 'https://www.bitbuzz.io' : 'https://bitbuzz-testnet.vercel.app'}/profile/${record.deployerAddress}`} target='_blank'>
                            <ArrowRightOutlined style={{ color: '#fff', transform: 'rotate(-0.125turn)' }} />
                        </a>
                    </div>
                    <div className="metaid">MetaID :<Tooltip title={record.deployerMetaId}>{record.deployerMetaId.replace(/(\w{6})\w+(\w{5})/, "$1...")}</Tooltip> </div>
                    {btcAddress !== record.deployerAddress && <Button style={{ height: 24, fontSize: 10 }} shape="round" disabled={record.isFollowing} size='small' onClick={(e) => { e.stopPropagation(); handleFollow(record) }} type='link'> {record.isFollowing ? 'Following' : 'Follow'}</Button>}

                </div>
            </div>
            <div className="topRight">
                <div className="progress ">
                    <NumberFormat value={percent} precision={2} suffix='%' />
                    <Progress className="Progress" percent={percent > 1 ? percent : 1} showInfo={false}>

                    </Progress>
                </div>
                <Space>
                    <Button size='small' disabled={!record.mintable} onClick={(e) => {
                        e.stopPropagation();
                        showMintNotice(record)

                    }} type='primary'>Mint</Button>

                    <Button size='small' onClick={(e) => {
                        e.stopPropagation();
                        if (localStorage.getItem('tradeNotice') === '1') {
                            window.open(`https://orders-mrc20.vercel.app/orderbook/idcoin/btc-${record.tick}`, '_blank')

                        } else {
                            showTradeNotice(record)
                        }

                    }} type='primary'>Trade</Button>
                </Space>
            </div>
        </div>
        <Divider />
        <div className="bottom">
            <div className="bottomLeft">
                <div className="item">
                    <div className="label ">Ticker</div>
                    <div className="value tick">{record.tick}</div>
                </div>
                <div className="item">
                    <div className="label">Price</div>
                    <div className="value"><NumberFormat value={record.price} isBig decimal={8} tiny suffix=' BTC' /></div>
                </div>

            </div>
            <div className="bottomRight">
                <div className="item">
                    <div className="label">Followers Limit</div>
                    <div className="value"><NumberFormat value={record.followersLimit} /></div>
                </div>
                <div className="item">
                    <div className="label">Pool</div>
                    <div className="value"><NumberFormat value={record.pool} decimal={8} isBig suffix=' BTC' /></div>
                </div>
            </div>
        </div>

    </Card>
}
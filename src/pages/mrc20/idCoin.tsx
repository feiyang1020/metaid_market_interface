import useIntervalAsync from '@/hooks/useIntervalAsync';
import { getIdCoinInfo, getMrc20Info } from '@/services/api';
import { Avatar, Button, ConfigProvider, Divider, Progress, Statistic, Tabs, TabsProps, Typography, Grid, Card, Row, Col, Tooltip } from 'antd';
import { useCallback, useState } from 'react';
import { useMatch, useModel, history } from 'umi';
import './idCoin.less'
import Listed from './components/Listed';
import NumberFormat from '@/components/NumberFormat';
import { LeftOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import Activeity from './components/Activeity';
import MyActiveity from './components/MyActiveity';
import MetaIdAvatar from '@/components/MetaIdAvatar';
import MRC20Icon from '@/components/MRC20Icon';
import { formatSat } from '@/utils/utlis';
import btcIcon from "@/assets/logo_btc@2x.png";
import orders from '@/assets/image.svg';
const { useBreakpoint } = Grid;
const items: TabsProps['items'] = [
    {
        key: '1',
        label: 'Listed',
        children: 'Content of Tab Pane 1',
    },
    {
        key: '2',
        label: 'Activity',
        children: 'Content of Tab Pane 2',
    },
    {
        key: '3',
        label: 'My Activity',
        children: 'Content of Tab Pane 3',
    },
];

export default () => {
    const screens = useBreakpoint();
    const match = useMatch('/idCoin/:tick');
    const { network, btcAddress } = useModel('wallet')
    const [idCoin, setIdCoin] = useState<API.IdCoin>();
    const fetchData = useCallback(async () => {
        if (!match || !match.params.tick) return;
        const params: any = {};
        params.tick = match.params.tick
        const { data } = await getIdCoinInfo(network, params);
        setIdCoin(data);
    }, [match, network])
    const update = useIntervalAsync(fetchData, 100000)
    return <div className='IdCoinPage'>
        <div
            className="pageBack"
            onClick={() => {
                history.back();
            }}
        >
            <LeftOutlined /> Back
        </div>
        {
            idCoin && <div className='IdCoinInfo'>

                <Card bordered={false} styles={{ body: { display: 'flex', gap: 16, flexWrap: 'wrap', padding: 0 } }} style={{ background: 'rgba(0,0,0,0)' }}>
                    <MetaIdAvatar avatar={idCoin.deployerUserInfo.avatar} size={100} />
                    <div className="right" style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                            <div>
                                <Typography.Title level={4} style={{ margin: 0 }}>
                                    {idCoin.deployerUserInfo.name || idCoin.deployerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}
                                </Typography.Title>
                                <Typography.Text copyable={{ text: idCoin.deployerMetaId }} className="metaid"> MetaID: {idCoin.deployerMetaId.replace(/(\w{6})\w+(\w{5})/, "$1...")}</Typography.Text>
                            </div>
                            <div>
                                <Typography.Text className="ticker"><NumberFormat value={idCoin.followersCount} /> </Typography.Text>
                                <div>
                                    Followers
                                </div>
                            </div>

                        </div>
                        <div className="mint colorPrimary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
                            <span>Minted : <NumberFormat value={idCoin.totalMinted} />  </span>
                            <span>Supply : <NumberFormat value={idCoin.totalSupply} /> </span>
                        </div>
                        <div className="slider" style={{ marginTop: 12 }}>
                            <Progress percent={Number(idCoin.supply / idCoin.totalSupply) * 100} showInfo={false} />
                        </div>
                        <div className="sliderNumber">

                            <NumberFormat value={(Number(idCoin.supply / idCoin.totalSupply) * 10)||0} precision={4} suffix=' %' />
                        </div>
                    </div>
                </Card>
                <Row gutter={[20, 20]} style={{ width: 474 }}>
                    <Col xs={12} sm={12} md={6} lg={6} xl={6} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title="Total volume" value={formatSat(idCoin.totalVolume)} prefix={<img style={{ width: 16, height: 16 }} src={btcIcon}></img>} />
                    </Col>
                    <Col xs={12} sm={12} md={6} lg={6} xl={6} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title="Market Cap" value={formatSat(idCoin.marketCap)} prefix={<img style={{ width: 16, height: 16 }} src={btcIcon}></img>} />
                    </Col>
                    <Col xs={12} sm={12} md={6} lg={6} xl={6} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title="Floor price" value={Number(idCoin.floorPrice) < 0.01 ? 0.01 : idCoin.floorPrice} precision={2} suffix='sats' />
                    </Col>
                    <Col xs={12} sm={12} md={6} lg={6} xl={6} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title="Holders" value={idCoin.holders} />
                    </Col>
                </Row>
                <Row >
                    <Card bordered={false} styles={{ body: { padding: '24px 16px' } }} style={{ background: 'rgba(27, 27, 27, 0.5)', width: 443,borderRadius:16 }}>
                        <div className='orders'>
                            <img src={orders} alt="" /> <Tooltip title='ID-coin can be traded on third-party orders and can also be listed for trading on the market. In third-party order trading, the liquidity of the pool is different from that of the market.'><QuestionCircleOutlined /></Tooltip>
                        </div>
                        <div className='tradeInfo'>
                            <div className="item">
                                <NumberFormat prefix={<>Pool <img src={btcIcon} /> {' '}</>} value={idCoin.pool} isBig decimal={8} />
                            </div>
                            <div className="item">
                                <NumberFormat prefix={<>Price <img src={btcIcon} /></>} value={idCoin.price} isBig decimal={8} />
                            </div>
                            <Button type='primary' onClick={() => { window.open(`https://orders-mrc20.vercel.app/orderbook/idcoin/btc-${idCoin.tick}`, '_blank') }}>Trade</Button>
                        </div>
                    </Card>
                </Row>
                {
                    idCoin.mintable && <div className='mintBtn'>
                        <Button type='primary' block onClick={() => { history.push('/inscribe?tab=MRC-20&tickerId=' + idCoin.mrc20Id) }}>Mint</Button>
                    </div>
                }


            </div>
        }
        <ConfigProvider
            theme={{
                components: {
                    "Tabs": {
                        "inkBarColor": "rgba(22, 119, 255, 0)",
                        "colorBorder": "rgba(0, 0, 0, 0)",
                        colorBorderSecondary: 'rgba(0, 0, 0, 0)'

                    },
                    "Table": {
                        "borderColor": "rgba(240, 240, 240, 0)"
                    }
                },
            }}
        >
            {idCoin && <Tabs size='small' style={{ marginTop: 22 }} defaultActiveKey="1" items={[
                {
                    key: '1',
                    label: 'Listed',
                    children: <Listed mrc20Id={idCoin.mrc20Id || ''} />,
                },
                {
                    key: '2',
                    label: 'Activity',
                    children: <Activeity mrc20Id={idCoin.mrc20Id || ''} />,
                },
                {
                    key: '3',
                    label: 'My Activity',
                    children: <Activeity mrc20Id={idCoin.mrc20Id || ''} showMy />,
                },
                {
                    key: '4',
                    label: 'My Listed',
                    children: <Listed mrc20Id={idCoin.mrc20Id || ''} showMy />,
                },
            ]} />}
        </ConfigProvider>

    </div>
}
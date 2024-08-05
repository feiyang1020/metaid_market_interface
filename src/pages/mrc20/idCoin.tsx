import useIntervalAsync from '@/hooks/useIntervalAsync';
import { getIdCoinInfo, getMrc20AddressUtxo, getMrc20Info, redeemPreview } from '@/services/api';
import { Avatar, Button, ConfigProvider, Divider, Progress, Statistic, Tabs, TabsProps, Typography, Grid, Card, Row, Col, Tooltip, Space, message, Popover } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useMatch, useModel, history, Link } from 'umi';
import './idCoin.less'
import Listed from './components/Listed';
import NumberFormat from '@/components/NumberFormat';
import { LeftOutlined, LinkOutlined, QuestionCircleOutlined, RightOutlined, ShareAltOutlined, XOutlined } from '@ant-design/icons';
import Activeity from './components/Activeity';
import MyActiveity from './components/MyActiveity';
import MetaIdAvatar from '@/components/MetaIdAvatar';
import MRC20Icon from '@/components/MRC20Icon';
import { formatSat, openWindowTarget } from '@/utils/utlis';
import btcIcon from "@/assets/logo_btc@2x.png";
import orders from '@/assets/image.svg';
import { getCreatePinFeeByNet, getMetaIdUrlByNet, getOrdersTradeUrlByNet } from '@/config';
import copy from 'copy-to-clipboard';
import { addUtxoSafe } from '@/utils/psbtBuild';
import ConfirmRedeem from '@/components/ConfirmRedeem';
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
    const { network, btcAddress, authParams, btcConnector, connected, connect, feeRate } = useModel('wallet')
    const [idCoin, setIdCoin] = useState<API.IdCoin>();
    const [showListBtn, setShowListBtn] = useState<boolean>(false)
    const [bal, setBal] = useState<number>(0);
    const [showRedeem, setShowRedeem] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const fetchData = useCallback(async () => {
        if (!match || !match.params.tick) return;
        const params: any = {};
        params.tick = match.params.tick;
        if (btcAddress) {
            params.address = btcAddress
        }
        const { data } = await getIdCoinInfo(network, params);
        setIdCoin(data);
    }, [match, network, btcAddress])

    const handleFollow = async () => {
        if (!connected) {
            await connect();
            return
        }
        if (!btcConnector || !idCoin || !btcAddress) return
        try {
            const followRes = await btcConnector.inscribe({
                inscribeDataArray: [
                    {
                        operation: 'create',
                        path: '/follow',
                        body: idCoin.deployerMetaId,
                        contentType: 'text/plain;utf-8',
                        flag: network === "mainnet" ? "metaid" : "testid",
                    },
                ],
                options: {
                    noBroadcast: 'no',
                    feeRate: feeRate,
                    // service: getCreatePinFeeByNet(network),
                },
            });
            if (followRes.status) throw new Error(followRes.status)
            if (followRes && followRes.revealTxIds && followRes.revealTxIds[0]) {
                message.success('Follow successfully! Please wait for the transaction to be confirmed!')
                setIdCoin({ ...idCoin, isFollowing: true })
                // await fetchData()
                await addUtxoSafe(btcAddress, [{ txId: followRes.commitTxId, vout: 1 }])
            } else {
                throw new Error('Follow failed')
            }
        } catch (err: any) {
            message.error(err.message || 'Follow failed')
        }
    }

    const fetchUserUtxo = useCallback(async () => {
        try {
            if (!idCoin || !btcAddress) throw new Error('no idCoin or btcAddress')
            const { data: utxoList, code } = await getMrc20AddressUtxo(network, { address: btcAddress, tickId: idCoin.mrc20Id, cursor: 0, size: 100 }, {
                headers: {
                    ...authParams,
                },
            });
            let _showListBtn = false;
            let _bal = 0
            if (code === 0) {
                const UTXOs:string[] = []
                _bal = utxoList.list.reduce((a, item) => {
                    if (item.orderId === '') {
                        const utxoAmount = item.mrc20s.reduce((a, b) => {
                            UTXOs.push(b.txPoint.replace(':','_'))
                            return a + Number(b.amount)
                        }, 0);
                        return a + utxoAmount
                    }
                    return a
                }, 0)
                const find = utxoList.list.find((item) => {
                    return item.orderId === '' && item.mrc20s.length > 0
                })
                if (find) {
                    _showListBtn = true
                }
                const preview = await redeemPreview(network, { sellerAddress: btcAddress, tickId: idCoin.mrc20Id, networkFeeRate:feeRate,assetUtxoIds:UTXOs}, {
                    headers: {
                        ...authParams,
                    },
                });
            }
            setShowListBtn(_showListBtn)
            setBal(_bal)
        } catch (err) {

        }
        setLoading(false)

    }, [
        btcAddress,
        network,
        authParams,
        idCoin
    ])

    useEffect(() => { fetchUserUtxo() }, [fetchUserUtxo])
    const update = useIntervalAsync(fetchData, 100000)

    const shareX = () => {
        const shareText = `I found an interesting MetaID Token that's currently offering free minting! Join me in getting this ${idCoin?.tick} token for free:  ${window.location.href}`;
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        window.open(shareUrl, '_blank');
    }
    const copyLink = () => {
        copy(window.location.href)
        message.success('Link copied to clipboard')
    }
    return <div className='IdCoinPage'>
        <div
            className="pageBack"
            onClick={() => {
                history.back();
                // shareX()
            }}
        >
            <LeftOutlined /> Back
        </div>
        {
            idCoin && <div className='IdCoinInfo'>

                <Card bordered={false} styles={{ body: { display: 'flex', gap: 16, flexWrap: 'wrap', padding: 0 } }} style={{ background: 'rgba(0,0,0,0)' }}>
                    <div style={{ cursor: 'pointer' }} onClick={() => { window.open(getMetaIdUrlByNet(network) + idCoin.deployerMetaId) }}>
                        <MetaIdAvatar avatar={idCoin.deployerUserInfo.avatar} size={100} />
                    </div>

                    <div className="right" style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                            <div>
                                <Typography.Title level={4} style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                    <div onClick={() => { window.open(getMetaIdUrlByNet(network) + idCoin.deployerMetaId) }}>
                                        {idCoin.tick}
                                    </div> <Button style={{ height: 24, fontSize: 10 }} shape="round" disabled={idCoin.isFollowing} size='small' onClick={(e) => { e.stopPropagation(); handleFollow() }} type='link'> {idCoin.isFollowing ? 'Following' : 'Follow'}</Button>
                                </Typography.Title>
                                <Typography.Text copyable={{ text: idCoin.deployerMetaId }} className="metaid"> MetaID: {idCoin.deployerMetaId.replace(/(\w{6})\w+(\w{5})/, "$1...")}</Typography.Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
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
                        <div className="slider" style={{ marginTop: 0 }}>
                            <Progress percent={Number(idCoin.supply / idCoin.totalSupply) * 100} showInfo={false} />
                        </div>
                        <div className="sliderNumber">

                            <NumberFormat value={(Number(idCoin.supply / idCoin.totalSupply) * 100) || 0} floor precision={4} suffix=' %' />
                        </div>
                    </div>
                </Card>
                <Row gutter={[20, 20]} style={{ width: 474 }}>
                    <Col xs={12} sm={12} md={6} lg={6} xl={6} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title="Total Volume" value={formatSat(idCoin.totalVolume)} prefix={<img style={{ width: 16, height: 16 }} src={btcIcon}></img>} />
                    </Col>
                    <Col xs={12} sm={12} md={6} lg={6} xl={6} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title="Market Cap" value={formatSat(idCoin.marketCap)} prefix={<img style={{ width: 16, height: 16 }} src={btcIcon}></img>} />
                    </Col>
                    <Col xs={12} sm={12} md={6} lg={6} xl={6} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16, whiteSpace: 'nowrap' }} title="Floor Price" formatter={() => <NumberFormat value={idCoin.floorPrice} isBig decimal={8} tiny suffix=' BTC' />} />
                    </Col>
                    <Col xs={12} sm={12} md={6} lg={6} xl={6} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title={<Space size={4} style={{ cursor: 'pointer' }} onClick={() => { history.push('/holders/' + idCoin.tick) }}>Holders <RightOutlined style={{ fontSize: 10 }} /></Space>} value={idCoin.holders} />
                    </Col>
                </Row>
                <Row >
                    <Card bordered={false} styles={{ body: { padding: '24px 16px' } }} style={{ background: 'rgba(27, 27, 27, 0.5)', width: 328, borderRadius: 16 }}>
                        <div className="ordersWrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div className='orders'>
                                <img src={orders} alt="" /> <Tooltip title='You can trade ID-coin on the third-party DEX Orders.exchange, which we have partnered with. Orders.exchange and this marketplace are two separate and independent applications.'><QuestionCircleOutlined /></Tooltip>
                            </div>
                            <a href={getOrdersTradeUrlByNet(network, idCoin.tick, btcAddress)} style={{ borderBottom: '1px solid #D4F66B' }} target={openWindowTarget()}>Trade</a>
                        </div>

                        <div className='tradeInfo'>
                            <div className="item">
                                <NumberFormat prefix={<>Pool <img src={btcIcon} /> {' '}</>} value={idCoin.ordersPool} isBig decimal={8} tiny />
                            </div>
                            <div className="item">
                                <NumberFormat prefix={<>Price <img src={btcIcon} /></>} value={idCoin.ordersPrice} isBig decimal={8} tiny />
                            </div>

                        </div>
                    </Card>
                </Row>
                <Space>
                    {
                        showListBtn && <ConfigProvider
                            theme={{
                                components: {
                                    Button: {
                                        "defaultBorderColor": "rgb(212, 246, 107)",
                                        "defaultColor": "rgb(212, 246, 107)"
                                    },
                                },
                            }}
                        >
                            <Button loading={loading} disabled={!showListBtn} block onClick={() => { history.push('/list/idCoins/' + idCoin.tick) }}>List For Sale </Button>
                        </ConfigProvider>
                    }

                    {
                        showListBtn && <ConfigProvider
                            theme={{
                                components: {
                                    Button: {
                                        "defaultBorderColor": "rgb(212, 246, 107)",
                                        "defaultColor": "rgb(212, 246, 107)"
                                    },
                                },
                            }}
                        >
                            <Button loading={loading} type='primary' disabled={!showListBtn} block onClick={() => { setShowRedeem(true) }}>Redeem for BTC </Button>
                        </ConfigProvider>
                    }



                    {/* <Button type='primary'  disabled={idCoin.isFollowing} onClick={(e) => { e.stopPropagation(); handleFollow() }} > {idCoin.isFollowing ? 'Following' : 'Follow'}</Button> */}

                    {
                        idCoin.mintable && <div className='mintBtn'>
                            <Button type='primary' block onClick={() => { history.push('/inscribe/MRC-20/' + idCoin.tick) }}>Mint</Button>
                        </div>
                    }


                    <Popover content={<div className='sharePop' >
                        <div className="item" onClick={copyLink}>
                            <LinkOutlined /> Copy link
                        </div>
                        <Divider className='shareDivider' />
                        <div className="item" onClick={shareX}>
                            <XOutlined /> Share on X
                        </div>
                    </div>} title="">
                        <Button type='text' icon={<ShareAltOutlined />} ></Button>
                    </Popover>

                </Space>


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
        {idCoin && showListBtn && <ConfirmRedeem show={showRedeem} idCoin={idCoin} onClose={() => {
            setShowRedeem(false)
            fetchUserUtxo()
        }} amount={bal} goOrders={() => {
            window.open(getOrdersTradeUrlByNet(network, idCoin.tick, btcAddress), openWindowTarget())
        }}
            btcPrice={0}
            handelRedeem={fetchUserUtxo}
        />}


    </div>
}
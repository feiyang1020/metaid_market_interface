import useIntervalAsync from '@/hooks/useIntervalAsync';
import { getMrc20Info } from '@/services/api';
import { Avatar, Button, ConfigProvider, Divider, Progress, Statistic, Tabs, TabsProps, Typography, Grid } from 'antd';
import { useCallback, useState } from 'react';
import { useMatch, useModel, history } from 'umi';
import './index.less'
import Listed from './components/Listed';
import NumberFormat from '@/components/NumberFormat';
import { LeftOutlined } from '@ant-design/icons';
import Activeity from './components/Activeity';
import MyActiveity from './components/MyActiveity';
import MetaIdAvatar from '@/components/MetaIdAvatar';
import MRC20Icon from '@/components/MRC20Icon';
import { formatSat } from '@/utils/utlis';
import btcIcon from "@/assets/logo_btc@2x.png";
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
    const match = useMatch('/mrc20/:mrc20Id');
    const { network, btcAddress } = useModel('wallet')
    const [mrc20Info, setMrc20Info] = useState<API.MRC20TickInfo>();
    const fetchData = useCallback(async () => {
        if (!match || !match.params.mrc20Id) return;
        const { data } = await getMrc20Info(network, { tickId: match.params.mrc20Id });
        setMrc20Info(data);
    }, [match, network])
    const update = useIntervalAsync(fetchData, 100000)
    return <div className='mrc20Page'>
        <div
            className="pageBack"
            onClick={() => {
                history.back();
            }}
        >
            <LeftOutlined /> Back
        </div>
        {
            mrc20Info && <div className='mrc20Info'>
                <div className='left'>
                    <MRC20Icon size={102} tick={mrc20Info.tick} metadata={mrc20Info.metaData} />

                    <div className="info">
                        <div className="top">
                            <div className="nameWrap">
                                <div className="name">
                                    <div className='tick'>{mrc20Info.tick} </div>

                                    <Button
                                        type='link'
                                        size='small'
                                        className='btn'
                                        style={{ fontSize: 10 }}
                                    >
                                        MRC-20
                                    </Button>
                                </div>
                                <Typography.Text className="token" copyable={{ text: mrc20Info.mrc20Id }}><span style={{ color: '#fff' }}>{mrc20Info.tokenName}</span>  TokenID: {mrc20Info.mrc20Id.replace(/(\w{4})\w+(\w{5})/, "$1...$2")}</Typography.Text>
                            </div>

                            <div className="detail">
                                <span className='avatars'><span className='metaid'>Deployer</span><MetaIdAvatar size={20} avatar={mrc20Info.deployerUserInfo && mrc20Info.deployerUserInfo.avatar} /> {mrc20Info.deployerUserInfo && mrc20Info.deployerUserInfo.name || mrc20Info.deployerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}</span>
                                <span className='metaid'>MetaID : {mrc20Info.deployerMetaId.replace(/(\w{6})\w+(\w{5})/, "$1...")}</span>
                            </div>
                        </div>


                        <div className="mint colorPrimary">
                            <span>Minted : <NumberFormat value={mrc20Info.totalMinted} /> </span>
                            <span>Supply : <NumberFormat value={mrc20Info.totalSupply} /> </span>
                        </div>
                        <div className="slider">
                            <Progress percent={Number(mrc20Info.supply / mrc20Info.totalSupply) * 100} showInfo={false} />
                        </div>
                        <div className="sliderNumber">

                            <NumberFormat value={Number(mrc20Info.supply / mrc20Info.totalSupply) * 100} precision={4} suffix=' %' />
                        </div>
                    </div>

                    <Divider type={screens.md ? 'vertical' : 'horizontal'} style={{ height: screens.md ? 75 : 1 }} />
                    <div className="desc">
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title="Total volume" value={formatSat(mrc20Info.totalVolume)} prefix={<img style={{ width: 16, height: 16 }} src={btcIcon}></img>} />
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title="Market Cap" value={formatSat(mrc20Info.marketCap)} prefix={<img style={{ width: 16, height: 16 }} src={btcIcon}></img>} />
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title="Floor price" value={mrc20Info.floorPrice} suffix='sats' />
                        <Statistic valueStyle={{ display: 'flex', alignItems: 'center', fontSize: 16 }} title="Holders" value={mrc20Info.holders} />
                    </div>
                </div>
                {
                    mrc20Info.mintable && <div className='mintBtn'>
                        <Button type='primary' block onClick={() => { history.push('/inscribe?tab=MRC-20&tickerId=' + mrc20Info.mrc20Id) }}>Mint</Button>
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
            <Tabs size='small' style={{ marginTop: 22 }} defaultActiveKey="1" items={[
                {
                    key: '1',
                    label: 'Listed',
                    children: <Listed mrc20Id={match && match.params.mrc20Id || ''} />,
                },
                {
                    key: '2',
                    label: 'Activity',
                    children: <Activeity mrc20Id={match && match.params.mrc20Id || ''} />,
                },
                {
                    key: '3',
                    label: 'My Activity',
                    children: <Activeity mrc20Id={match && match.params.mrc20Id || ''} btcAddress={btcAddress} />,
                },
                {
                    key: '4',
                    label: 'My Listed',
                    children: <Listed mrc20Id={match && match.params.mrc20Id || ''} btcAddress={btcAddress} />,
                },
            ]} /></ConfigProvider>

    </div>
}
import useIntervalAsync from '@/hooks/useIntervalAsync';
import { getMrc20Info } from '@/services/api';
import { Avatar, Button, ConfigProvider, Progress, Statistic, Tabs, TabsProps } from 'antd';
import { useCallback, useState } from 'react';
import { useMatch, useModel, history } from 'umi';
import './index.less'
import Listed from './components/Listed';
import NumberFormat from '@/components/NumberFormat';
import { LeftOutlined } from '@ant-design/icons';
import Activeity from './components/Activeity';
import MyActiveity from './components/MyActiveity';

const items: TabsProps['items'] = [
    {
        key: '1',
        label: 'Listed',
        children: 'Content of Tab Pane 1',
    },
    {
        key: '2',
        label: 'Activeity',
        children: 'Content of Tab Pane 2',
    },
    {
        key: '3',
        label: 'My Activeity',
        children: 'Content of Tab Pane 3',
    },
];

export default () => {
    const match = useMatch('/mrc20/:mrc20Id');
    const { network } = useModel('wallet')
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
                    <Avatar size={102} src={mrc20Info.metaData} >{mrc20Info.tokenName}</Avatar>
                    <div className="info">
                        <div className="name">{mrc20Info.tick}</div>
                        <div className="detail">
                            <Button
                                type='link'
                                size='small'
                                className='btn'
                            >
                                Mrc-20
                            </Button>
                            <span>Detail</span>
                        </div>
                        <div className="mint colorPrimary">
                            <span>Minted:<NumberFormat value={mrc20Info.totalMinted} /> </span>
                            <span>Supply:<NumberFormat value={mrc20Info.totalSupply} /> </span>
                        </div>
                        <div className="slider">
                            <Progress percent={Number(mrc20Info.supply / mrc20Info.totalSupply) * 100} showInfo={false} />
                        </div>
                    </div>
                    <div className="desc">
                        <Statistic title="Total volume" value={'--'} />
                        <Statistic title="Market Cap" value={mrc20Info.marketCap} />
                        <Statistic title="Floor price" value={mrc20Info.price} />
                        <Statistic title="Holders" value={mrc20Info.holders} />
                    </div>
                </div>
                <div className='mintBtn'>
                    <Button type='primary' onClick={() => { history.push('/inscribe?tab=MRC-20&tickerId=' + mrc20Info.mrc20Id) }}>Mint</Button>
                </div>

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
                    label: 'Activeity',
                    children: <Activeity mrc20Id={match && match.params.mrc20Id || ''} />,
                },
                {
                    key: '3',
                    label: 'My Activeity',
                    children: <MyActiveity mrc20Id={match && match.params.mrc20Id || ''} />,
                },
            ]} /></ConfigProvider>

    </div>
}
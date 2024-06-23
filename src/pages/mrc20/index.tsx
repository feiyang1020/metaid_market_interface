import useIntervalAsync from '@/hooks/useIntervalAsync';
import { getMrc20Info } from '@/services/api';
import { Avatar, Button, Progress, Statistic, Tabs, TabsProps } from 'antd';
import { useCallback, useState } from 'react';
import { useMatch, useModel } from 'umi';
import './index.less'
import Listed from './components/Listed';

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
        {
            mrc20Info && <div className='mrc20Info'>
                <div className='left'>
                    <Avatar src={mrc20Info.metaData} />
                    <div className="info">
                        <div className="name">{mrc20Info.tokenName}</div>
                        <div className="detail">
                            <Button
                                type='link'
                                size='small'
                            >
                                Mrc-20
                            </Button>
                            <span>Detail</span>
                        </div>
                        <div className="mint">
                            <span>Minted: {mrc20Info.totalMinted}</span>
                            <span>Supply:{mrc20Info.mintCount}</span>
                        </div>
                        <div className="slider">
                            <Progress percent={50} showInfo={false} />
                        </div>
                    </div>
                    <div className="desc">
                        <Statistic title="Active Users" value={112893} />
                        <Statistic title="Active Users" value={112893} />
                    </div>
                </div>
                <div className='mintBtn'>
                    <Button type='primary'>Mint</Button>
                </div>

            </div>
        }

        <Tabs defaultActiveKey="1" items={[
            {
                key: '1',
                label: 'Listed',
                children:<Listed mrc20Id={match&&match.params.mrc20Id||''}/>,
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
        ]} />

    </div>
}
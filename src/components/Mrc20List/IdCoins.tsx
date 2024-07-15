import usePageList from "@/hooks/usePageList"
import { getIdCoinList, getMrc20List } from "@/services/api"
import { ConfigProvider, Table, TableColumnsType, Grid, Progress, Button, Tooltip, Popconfirm, Modal, Checkbox, CheckboxProps, message } from "antd"
import { useModel, history } from "umi"
import NumberFormat from "../NumberFormat";
import Item from "./Item";
import { useCallback, useEffect, useState } from "react";
import MetaIdAvatar from "../MetaIdAvatar";
import { ArrowRightOutlined } from "@ant-design/icons";
import { getCreatePinFeeByNet } from "@/config";
const { useBreakpoint } = Grid;
export default () => {
    const screens = useBreakpoint();
    const [modal, contextHolder] = Modal.useModal();
    const { network, btcAddress, connect, connected, btcConnector, feeRates } = useModel("wallet")
    const [list, setList] = useState<API.IdCoin[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [page, setPage] = useState<number>(0);
    const [size, setSize] = useState<number>(10);
    const [params, setParams] = useState<Record<string, any>>({ orderBy: 'timestamp', sortType: -1 });
    const fetchData = useCallback(async () => {
        console.log(network, page, size, params)
        setLoading(true);
        const { code, message, data } = await getIdCoinList(network, {
            cursor: page * size,
            size,
            followerAddress: btcAddress || '',
            ...params,
        });
        if (code !== 0) return
        if (data.list) {
            setList(data.list);
            setTotal(data.total);
        }
        setLoading(false);
    }, [network, page, size, params, btcAddress]);

    const showMintNotice = (record: API.IdCoin) => {
        // modal.warning({
        //     title: 'Mint Notification',
        //     content: 'You have not yet been granted the right to mint tokens! Follow the deployed user to gain the ability to mint'
        // })
        history.push('/inscribe?tab=MRC-20&tickerId=' + record.mrc20Id)
    }
    const onChange: CheckboxProps['onChange'] = (e) => {
        console.log(`checked = ${e.target.checked}`);
    };
    const showTradeNotice = () => {
        modal.warning({
            title: 'Trade  Notification',
            content: <div>
                <p style={{ marginBottom: 40 }}>
                    When you choose to redirect to our partnered third-party trading platform through this link, please proactively assess the trading risks and be prepared to assume these risks yourself. We cannot guarantee the absolute safety of the transaction.
                </p>

                <Checkbox onChange={onChange}>I am aware of the above risks</Checkbox>
            </div>,
            onOk() {
                message.info('coming soon...')
            }

        })
    }
    const handleFollow = async (record: API.IdCoin) => {
        if (!connected) {
            await connect();
            return
        }
        if (!btcConnector) return
        try {
            const followRes = await btcConnector.inscribe({
                inscribeDataArray: [
                    {
                        operation: 'create',
                        path: '/follow',
                        body: record.deployerMetaId,
                        contentType: 'text/plain;utf-8',
                        flag: network === "mainnet" ? "metaid" : "testid",
                    },
                ],
                options: {
                    noBroadcast: 'no',
                    feeRate: feeRates[1].value,
                    service: getCreatePinFeeByNet(network),
                },
            });
            if (followRes.status) throw new Error(followRes.status)
            if (followRes && followRes.revealTxIds[0]) {
                message.success('Follow success')
                //  setList(list.map(item => {
                //     if (item.deployerMetaId === record.deployerMetaId) {
                //         item.isFollowing = true
                //     }
                //     return item
                //  }))
                await fetchData()
            }
        } catch (err: any) {
            message.error(err.message || 'Follow failed')
        }
    }

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    const columns: TableColumnsType<API.IdCoin> = [
        {
            title: 'Name',
            dataIndex: 'deployerUserInfo',
            render: (_, record) => {
                return <div className="idCoinDeploy">
                    <MetaIdAvatar size={72} avatar={record.deployerUserInfo.avatar} />
                    <div>
                        <div className="name">{record.deployerUserInfo.name || record.deployerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2")} <a onClick={(e) => e.stopPropagation()} href={`${network === 'mainnet' ? 'https://www.bitbuzz.io' : 'https://bitbuzz-testnet.vercel.app'}/profile/${record.deployerAddress}`} target='_blank'>
                            <ArrowRightOutlined style={{ color: '#fff', transform: 'rotate(-0.125turn)' }} />
                        </a></div>
                        <div className="metaid">MetaID : {record.deployerMetaId.replace(/(\w{6})\w+(\w{5})/, "$1...")}</div>
                        <Button style={{ height: 24, fontSize: 10 }} shape="round" disabled={record.isFollowing} size='small' onClick={(e) => { e.stopPropagation(); handleFollow(record) }} type='link'> {record.isFollowing ? 'Following' : 'Follow'}</Button>
                    </div>
                </div>
            },
            // fixed: 'left',
            width: 220
        },
        {
            title: 'Ticker',
            dataIndex: 'tick',
            width: 220,
            render: (item) => {
                return <div style={{ color: '#F68819', fontSize: 16, fontWeight: 'bold' }}>{item}</div>
            }
        },
        {
            title: 'Followers limit',
            dataIndex: 'followersLimit',

            width: 160
        },
        {
            title: 'Supply',
            dataIndex: 'supply',
            sorter: true,
            width: 160
        },
        {
            title: 'Price',
            dataIndex: 'price',
            // sorter: true,
            width: 140,
            render: (price) => {
                return <NumberFormat value={price} suffix=' sats' />
            }
        },

        {
            title: 'Pool',
            dataIndex: 'pool',
            sorter: true,
            width: 140,
            render: (price) => {
                return <NumberFormat value={price} decimal={8} isBig suffix=' BTC' />
            }
        },
        {
            title: 'Message',
            dataIndex: 'metaData',
            ellipsis: {
                showTitle: false,
            },

            render: (metaData) => {
                try {
                    return <Tooltip placement="topLeft" title={JSON.parse(metaData).message}>{JSON.parse(metaData).message} </Tooltip>
                } catch (e) {
                    return <></>
                }
            },
            width: 220
        },
        {
            title: 'Progress%',
            dataIndex: 'totalSupply',
            width: 200,
            render: (price, record) => {
                const percent = Number(record.supply / record.totalSupply) * 100
                return <div className="progressAndMint">

                    <div className="progress ">
                        <NumberFormat value={percent} precision={2} suffix='%' />
                        <Progress className="Progress" percent={percent > 1 ? percent : 1} showInfo={false}>

                        </Progress>
                    </div>

                    <Button size='small' onClick={(e) => { e.stopPropagation(); showMintNotice(record) }} type='primary'>Mint</Button>

                </div>
            }
        },
        {
            title: 'Trade',
            dataIndex: 'Trade',
            // fixed: 'right',
            width: 80,
            render: (_, record) => {
                return <Button size='small' onClick={(e) => { e.stopPropagation(); showTradeNotice() }} type='primary'>Trade</Button>
            }
        },

    ]

    return <ConfigProvider
        theme={{
            components: {
                "Tabs": {
                    "inkBarColor": "rgba(22, 119, 255, 0)",
                    "colorBorder": "rgba(0, 0, 0, 0)",
                    // colorBorderSecondary:'rgba(0, 0, 0, 0)'

                },
                "Table": {
                    "borderColor": "rgba(240, 240, 240, 0)",
                    "rowHoverBg": "rgba(110, 208, 63, 0.13)",
                    "fontSize": 16
                }
            },
        }}><Table
            style={{ margin: screens.lg ? '0 20px ' : '0 20px' }}
            columns={columns}
            rowKey={(record) => record.mrc20Id}
            dataSource={list}
            pagination={{
                position: ['bottomCenter'],
                pageSize: size,
                current: page + 1,
                total
            }}
            scroll={{ x: 1000 }}
            loading={loading}
            onChange={({ current, ...params }, _, sorter) => {
                console.log(sorter, 'params')
                if (!current) current = 1
                if (sorter.order) {
                    setParams({ orderBy: sorter.field === 'price' ? 'lastPrice' : sorter.field, sortType: sorter.order === 'ascend' ? 1 : -1 })
                } else {
                    setParams({})
                }
                setPage(current - 1)
            }}
            onRow={(record) => {
                return {
                    style: { cursor: 'pointer' },
                    onClick: () => {
                        // history.push(`/mrc20/${record.mrc20Id}`)
                    },
                }
            }}
        />
        {contextHolder}
    </ConfigProvider>
}
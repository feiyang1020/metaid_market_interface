import usePageList from "@/hooks/usePageList"
import { getIdCoinList, getMrc20List } from "@/services/api"
import { ConfigProvider, Table, TableColumnsType, Grid, Progress, Button, Tooltip, Popconfirm, Modal, Checkbox, CheckboxProps, message, List, TableProps } from "antd"
import { useModel, history } from "umi"
import NumberFormat from "../NumberFormat";
import Item from "./Item";
import { useCallback, useEffect, useState } from "react";
import MetaIdAvatar from "../MetaIdAvatar";
import { ArrowRightOutlined } from "@ant-design/icons";
import { getCreatePinFeeByNet, getOrdersTradeUrlByNet } from "@/config";
import IdCoinCard from "./IdCoinCard";
const { useBreakpoint } = Grid;
type OnChange = NonNullable<TableProps<API.IdCoin>['onChange']>;
type GetSingle<T> = T extends (infer U)[] ? U : never;
type Sorts = GetSingle<Parameters<OnChange>[2]>;

export default () => {
    const screens = useBreakpoint();
    const [modal, contextHolder] = Modal.useModal();
    const { network, btcAddress, connect, connected, btcConnector, feeRate } = useModel("wallet")
    const { searchWord, IdCoinPage: page, setIdCoinPage: setPage } = useModel('mrc20')
    const [list, setList] = useState<API.IdCoin[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    // const [page, setPage] = useState<number>(0);
    const [size, setSize] = useState<number>(10);
    const [params, setParams] = useState<Record<string, any>>({ orderBy: 'timestamp', sortType: -1 });
    const [orderBy, setOrderBy] = useState<string>('timestamp');
    const [sortType, setSortType] = useState<number>(-1);

    useEffect(() => {
        let didCancel = false;
        const fetchData = async () => {
            setLoading(true);
            const { code, message: msg, data } = await getIdCoinList(network, {
                cursor: page * size,
                size,
                followerAddress: btcAddress || '',
                searchTick: searchWord,
                orderBy,
                sortType,
            });
            if (didCancel) return
            if (code !== 0) {
                message.error(msg)
            }
            if (data && data.list) {
                setList(data.list);
                setTotal(data.total);
            } else {
                setList([])
                setTotal(0)
            }
            setLoading(false);
        };
        fetchData()
        return () => {
            didCancel = true;
        };
    }, [network, page, size, orderBy, sortType, btcAddress, searchWord])
    // const fetchData = useCallback(async () => {
    //     setLoading(true);
    //     const { code, message, data } = await getIdCoinList(network, {
    //         cursor: page * size,
    //         size,
    //         followerAddress: btcAddress || '',
    //         ...params,
    //     });
    //     if (code !== 0) return
    //     if (data.list) {
    //         setList(data.list);
    //         setTotal(data.total);
    //     }
    //     setLoading(false);
    // }, [network, page, size, params, btcAddress]);

    const showMintNotice = (record: API.IdCoin) => {
        // modal.warning({
        //     title: 'Mint Notification',
        //     content: 'You have not yet been granted the right to mint tokens! Follow the deployed user to gain the ability to mint'
        // })
        history.push({ pathname: '/inscribe/MRC-20/' + record.tick }, { from: 'idCoins' })
    }
    const onChange: CheckboxProps['onChange'] = (e) => {
        console.log(`checked = ${e.target.checked}`);
        localStorage.setItem('tradeNotice', e.target.checked ? '1' : '0')
    };
    const showTradeNotice = (record: API.IdCoin) => {
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
                window.open(`${getOrdersTradeUrlByNet(network)}${record.tick}`, '_blank')
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
                    feeRate: feeRate,
                    service: getCreatePinFeeByNet(network),
                },
            });
            if (followRes.status) throw new Error(followRes.status)
            if (followRes && followRes.revealTxIds && followRes.revealTxIds[0]) {
                message.success('Follow successfully! Please wait for the transaction to be confirmed!')
                setList(list.map(item => {
                    if (item.deployerMetaId === record.deployerMetaId) {
                        item.isFollowing = true
                    }
                    return item
                }))
                // await fetchData()
            } else {
                throw new Error('Follow failed')
            }
        } catch (err: any) {
            message.error(err.message || 'Follow failed')
        }
    }

    // useEffect(() => {
    //     fetchData();
    // }, [fetchData]);
    const columns: TableColumnsType<API.IdCoin> = [
        {
            title: 'Name',
            key: 'name',
            dataIndex: 'deployerUserInfo',
            render: (_, record) => {
                return <div className="idCoinDeploy">
                    <MetaIdAvatar size={screens.xl ? 72 : 50} avatar={record.deployerUserInfo.avatar} />
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
                        <Button style={{ height: 24, fontSize: 10 }} shape="round" disabled={record.isFollowing} size='small' onClick={(e) => { e.stopPropagation(); handleFollow(record) }} type='link'> {record.isFollowing ? 'Following' : 'Follow'}</Button>

                    </div>
                </div>
            },
            // fixed: 'left',
            width: 200
        },
        {
            title: 'Ticker',
            dataIndex: 'tick',
            key: 'tick',
            width: 110,
            align: 'center',
            ellipsis: true,
            render: (item) => {
                return <div style={{ color: '#F68819', fontWeight: 'bold' }}>{item}</div>
            }
        },
        {
            title: 'Followers Limit',
            dataIndex: 'followersLimit',
            key: 'followersLimit',
            align: 'center',
            width: 160,
            render: (item) => {
                return <NumberFormat value={item} />
            }
        },
        {
            title: 'Supply',
            dataIndex: 'totalSupply',
            key: 'totalSupply',
            sorter: true,
            align: 'center',
            width: 160,
            render: (item) => {
                return <NumberFormat value={item} />
            }
        },
        {
            title: 'Liquidity Per Mint',
            dataIndex: 'liquidityPerMint',
            key: 'liquidityPerMint',
            // sorter: true,
            width: 140,
            align: 'center',
            render: (price) => {
                return <NumberFormat value={price} />
            }
        },

        {
            title: 'Pool',
            dataIndex: 'pool',
            key: 'pool',
            sorter: true,
            width: 140,
            align: 'center',
            render: (price) => {
                return <NumberFormat value={price} decimal={8} isBig suffix=' BTC' />
            }
        },
        {
            title: 'Message',
            dataIndex: 'metaData',
            key: 'metaData',
            align: 'center',
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
            width: 120
        },
        {
            title: 'Progress%',
            dataIndex: 'totalSupply',
            key: 'totalSupply',
            width: 200,
            align: 'center',
            render: (price, record) => {
                const percent = (Number(record.supply / record.totalSupply) * 100) || 0;
                return <div className="progressAndMint">

                    <div className="progress ">
                        <NumberFormat value={percent} precision={2} suffix='%' />
                        <Progress className="Progress" percent={percent > 1 ? percent : 1} showInfo={false}>

                        </Progress>
                    </div>
                    {
                        record.mintable && <Button size='small' disabled={!record.mintable} onClick={(e) => {
                            e.stopPropagation();
                            showMintNotice(record)

                        }} type='primary'>Mint</Button>
                    }


                </div>
            }
        },
        {
            title: 'Trade',
            dataIndex: 'Trade',
            // fixed: 'right',
            key: 'Trade',
            align: 'center',
            width: 80,
            render: (_, record) => {
                return <Button size='small' onClick={(e) => {
                    e.stopPropagation();
                    if (localStorage.getItem('tradeNotice') === '1') {
                        window.open(`${getOrdersTradeUrlByNet(network)}${record.tick}`, '_blank')

                    } else {
                        showTradeNotice(record)
                    }

                }} type='primary'>Trade</Button>
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
                    // "fontSize": 16
                }
            },
        }}>
        {screens.md ? <Table
            style={{ margin: screens.xl ? '0 20px ' : '0 0px' }}
            columns={columns.filter(item => !['followersLimit', 'metaData'].includes(item.dataIndex) || screens.xl)}
            rowKey={(record) => record.mrc20Id}
            dataSource={list}
            size={screens.xl ? 'middle' : 'small'}
            pagination={{
                position: ['bottomCenter'],
                pageSize: size,
                current: page + 1,
                total,
                onChange: (page) => {
                    setPage(page - 1);
                },
            }}
            scroll={{ x: 800 }}
            loading={loading}
            onChange={(_1, _2, sorter) => {
                // setOrderBy(sorter.field || 'timestamp');
                // setSortType(sorter.order === 'ascend' ? 1 : -1);
                const { field, order } = sorter as Sorts;
                if (order) {
                    setOrderBy((field || '').toString());
                    setSortType(order === 'ascend' ? 1 : -1);
                } else {
                    setOrderBy('holders');
                    setSortType(-1);
                }
            }}
            onRow={(record) => {
                return {
                    style: { cursor: 'pointer' },
                    onClick: () => {
                        history.push(`/idCoin/${record.tick}`)
                    },
                }
            }}
        /> : <List
            loading={loading}
            grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
            dataSource={list}
            renderItem={(item) => (
                <List.Item>
                    <IdCoinCard record={item} showMintNotice={showMintNotice} showTradeNotice={showTradeNotice} handleFollow={handleFollow} />
                </List.Item>
            )}
            rowKey={"mrc20Id"}
            pagination={{
                onChange: (page) => {
                    setPage(page - 1);
                },
                position: "bottom",
                align: "center",
                pageSize: 10,
                total: total,
                current: page + 1,
            }}
        />}

        {contextHolder}
    </ConfigProvider>
}
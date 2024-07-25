import usePageList from "@/hooks/usePageList"
import { getMrc20List } from "@/services/api"
import { ConfigProvider, Table, TableColumnsType, Grid, Tooltip, Slider, Progress, Button, List, message } from "antd"
import { useModel, history } from "umi"
import NumberFormat from "../NumberFormat";
import Item from "./Item";
import { useCallback, useEffect, useState } from "react";
import Meta from "antd/es/card/Meta";
import MetaIdAvatar from "../MetaIdAvatar";
import PopLvl from "../PopLvl";
import dayjs from "dayjs";
import MintingCard from "./MintingCard";
const { useBreakpoint } = Grid;
export default () => {
    const screens = useBreakpoint();
    const { network } = useModel("wallet")
    const { searchWord, MintingPage: page, setMintingPage: setPage } = useModel('mrc20')
    const [list, setList] = useState<API.MRC20Info[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    // const [page, setPage] = useState<number>(0);
    const [size, setSize] = useState<number>(10);
    const [params, setParams] = useState<Record<string, any>>({});
    const [orderBy, setOrderBy] = useState<string>('holders');
    const [sortType, setSortType] = useState<number>(-1);
    // const fetchData = useCallback(async () => {
    //     setLoading(true);
    //     const { code, message, data } = await getMrc20List(network, {
    //         cursor: page * size,
    //         size,
    //         completed: false,
    //         ...params,
    //     });
    //     if (code !== 0) return
    //     if (data.list) {
    //         setList(data.list);
    //         setTotal(data.total);
    //     }
    //     setLoading(false);
    // }, [network, page, size, params]);

    // useEffect(() => {
    //     fetchData();
    // }, [fetchData]);
    useEffect(() => {
        let didCancel = false;
        const fetchData = async () => {
            setLoading(true);
            const { code, message: msg, data } = await getMrc20List(network, {
                cursor: page * size,
                size,
                completed: false,
                searchTick:searchWord,
                orderBy,
                sortType,
            });
            if (didCancel) return
            if (code !== 0) {
                message.error(msg)
            }
            if (data.list) {
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
    }, [network, page, size, orderBy,sortType, searchWord])
    const columns: TableColumnsType<API.MRC20Info> = [
        {
            title: 'Token',
            dataIndex: 'tick',
            // fixed: 'left',
            width: 220,
            render: (_, record) => {
                return <Item info={record} />
            }
        },
        {
            title: 'Deployer',
            dataIndex: 'deployerUserInfo',
            width: 160,
            render: (deployerUserInfo, record) => {
                return <div className="deployer">
                    <div className="deployerInfo">
                        <MetaIdAvatar size={20} avatar={record.deployerUserInfo.avatar} /><div className="deployerName">{record.deployerUserInfo.name || record.deployerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}</div>
                    </div>
                    <div className="MetaId">
                        MetaID:{record.deployerMetaId.replace(/(\w{6})\w+(\w{5})/, "$1...")}
                    </div>
                </div>
            }
        },

        {
            title: 'Minted',
            dataIndex: 'totalMinted',
            sorter: true,
            width: 160,
            align: 'center',
            render: (totalMinted) => {
                return <NumberFormat value={totalMinted} />
            }
        },
        {
            title: 'Holders',
            dataIndex: 'holders',
            sorter: true,
            width: 160,
            align: 'center',
            render: (price) => {
                return <NumberFormat value={price} />
            }
        },
        {
            title: 'Condition',
            dataIndex: 'pinCheck',
            width: 170,
            render: (_, record) => {
                if (!record.pinCheck) return <div className="condition">--</div>
                return <div className="condition"><div>
                    <Tooltip title={record.pinCheck.path}>path:{record.pinCheck.path.length > 45 ? record.pinCheck.path.replace(/(.{35}).+(.{11})/, "$1...$2") : record.pinCheck.path}</Tooltip></div> <div className="lvlCount"><PopLvl lvl={record.pinCheck.lvl} />  <span className="colorPrimary"> x {record.pinCheck.count || '0'}</span></div></div>
            }
        },
        {
            title: 'Premine',
            dataIndex: 'Premine',
            // sorter: true,
            width: 200,
            align: 'center',
            render: (_, record) => {
                return <div className="premine">{Number(record.premineCount) > 0 ? <NumberFormat value={Number(record.premineCount) / Number(record.mintCount) * 100} suffix='%' precision={4} /> : 'Fair Launch'}</div>
            }
        },
        {
            title: 'Time',
            dataIndex: 'deployTime',
            // sorter: true,
            align: 'center',
            width: 200,
            render: (price) => {
                return dayjs(price * 1000).format('MM/DD/YYYY,HH:mm')
            }
        },
        {
            title: 'Progress%',
            dataIndex: 'totalSupply',
            width: 200,
            render: (price, record) => {
                const percent = Number(record.supply / record.totalSupply) * 100||0;
                return <div className="progress">
                    <NumberFormat value={percent} precision={2} suffix='%' />
                    <Progress className="Progress" percent={percent > 1 ? percent : 1} showInfo={false}>

                    </Progress>
                </div>
            }
        },
        {
            title: '',
            dataIndex: 'mint',
            // fixed: 'right',
            width: 80,
            render: (_, record) => {
                return <Button size='small' onClick={(e) => { e.stopPropagation(); history.push('/inscribe/MRC-20/' + record.tick) }} type='primary'>Mint</Button>
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
        }}> {screens.md ? <Table
            style={{ margin: screens.lg ? '0 20px ' : '0 0px' }}
            columns={columns}
            rowKey={(record) => record.mrc20Id}
            dataSource={list}
            // size='small'
            pagination={{
                position: ['bottomCenter'],
                pageSize: size,
                current: page + 1,
                total,
                onChange: (page) => {
                    setPage(page - 1);
                },
            }}
            size={screens.xl ? 'middle' : 'small'}
            scroll={{ x: 1000 }}
            loading={loading}
            // onChange={({ current, ...params }, _, sorter) => {
            //     if (!current) current = 1;
            //     if (sorter.order) {
            //         setParams({ orderBy: sorter.field === 'price' ? 'lastPrice' : sorter.field, sortType: sorter.order === 'ascend' ? 1 : -1 })
            //     } else {
            //         setParams({})
            //     }
            //     setPage(current - 1)
            // }}
            onChange={(_1, _2, sorter) => {
                setOrderBy(sorter.field === 'price' ? 'lastPrice' : sorter.field || 'marketCap');
                setSortType(sorter.order === 'ascend' ? 1 : -1);
            }}
            onRow={(record) => {
                return {
                    style: { cursor: 'pointer' },
                    onClick: () => {
                        history.push(`/mrc20/${record.tick}`)
                    },
                }
            }}
        /> : <List
            loading={loading}
            grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
            dataSource={list}
            renderItem={(item) => (
                <List.Item>
                    <MintingCard record={item} />
                </List.Item>
            )}
            rowKey={"mrc20Id"}
            pagination={{
                onChange: (page) => {
                    setLoading(true);
                    setPage(page - 1);
                },
                position: "bottom",
                align: "center",
                pageSize: 10,
                total: total,
                current: page + 1,
            }}
        />}
    </ConfigProvider>
}
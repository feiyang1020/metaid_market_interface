import usePageList from "@/hooks/usePageList"
import { getMrc20List } from "@/services/api"
import { ConfigProvider, Table, TableColumnsType, Grid, Tooltip, Slider, Progress, Button } from "antd"
import { useModel, history } from "umi"
import NumberFormat from "../NumberFormat";
import Item from "./Item";
import { useCallback, useEffect, useState } from "react";
import Meta from "antd/es/card/Meta";
import MetaIdAvatar from "../MetaIdAvatar";
import PopLvl from "../PopLvl";
import dayjs from "dayjs";
const { useBreakpoint } = Grid;
export default () => {
    const screens = useBreakpoint();
    const { network } = useModel("wallet")

    const [list, setList] = useState<API.MRC20Info[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [page, setPage] = useState<number>(0);
    const [size, setSize] = useState<number>(10);
    const [params, setParams] = useState<Record<string, any>>({});
    const fetchData = useCallback(async () => {
        console.log(network, page, size, params)
        setLoading(true);
        const { code, message, data } = await getMrc20List(network, {
            cursor: page * size,
            size,
            completed: false,
            ...params,
        });
        if (code !== 0) return
        if (data.list) {
            setList(data.list);
            setTotal(data.total);
        }
        setLoading(false);
    }, [network, page, size, params]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
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
        // {
        //     title: 'Pending',
        //     dataIndex: 'Pending',
        //     sorter: true,
        //     render: (price) => {
        //         return <NumberFormat value={price} suffix=' sats' />
        //     }
        // },
        {
            title: 'Minted',
            dataIndex: 'totalMinted',
            sorter: true,
            width: 160,
            render: (totalMinted) => {
                return <NumberFormat value={totalMinted} />
            }
        },
        {
            title: 'Holders',
            dataIndex: 'holders',
            sorter: true,
            width: 160,
            render: (price) => {
                return <NumberFormat value={price} />
            }
        },
        {
            title: 'Condition',
            dataIndex: 'qual',
            width: 170,
            render: (qual, record) => {
                return <div className="condition"><div>
                    <Tooltip title={record.qual.path}>path:{record.qual.path.length > 45 ? record.qual.path.replace(/(.{35}).+(.{11})/, "$1...$2") : record.qual.path}</Tooltip></div> <div className="lvlCount"><PopLvl lvl={record.qual.lvl} />  <span className="colorPrimary"> X {record.qual.count || '1'}</span></div></div>
            }
        },
        {
            title: 'Premine',
            dataIndex: 'Premine',
            // sorter: true,
            width: 200,
            align: 'center',
            render: (_,record) => {
                return <div className="premine">{Number(record.premineCount)>0?<NumberFormat value={Number(record.premineCount/record.mintCount)*100} suffix='%' precision={4} />:'Fair Launch'}</div> 
            }
        },
        {
            title: 'Time',
            dataIndex: 'deployTime',
            // sorter: true,
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
                const percent = Number(record.supply / record.totalSupply) * 100
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
            fixed: 'right',
            width: 80,
            render: (_, record) => {
                return <Button size='small' onClick={(e) => { e.stopPropagation(); history.push('/inscribe?tab=MRC-20&tickerId=' + record.mrc20Id) }} type='primary'>Mint</Button>
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
                    "rowHoverBg": "rgba(110, 208, 63, 0.13)"
                }
            },
        }}><Table
            style={{ margin: screens.lg ? '0 20px ' : '0 20px' }}
            columns={columns}
            rowKey={(record) => record.mrc20Id}
            dataSource={list}
            // size='small'
            pagination={{
                pageSize: size,
                current: page + 1,
                total
            }}
            scroll={{ x: 1000 }}
            loading={loading}
            onChange={({ current, ...params }, _, sorter) => {
                console.log(sorter, 'params')
                if (!current) current = 1;
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
                        history.push(`/mrc20/${record.mrc20Id}`)
                    },
                }
            }}
        />
    </ConfigProvider>
}
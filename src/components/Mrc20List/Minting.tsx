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
            width: 250,
            render: (_, record) => {
                return <Item info={record} />
            }
        },
        {
            title: 'Deployer',
            dataIndex: 'deployerUserInfo',
            render: (deployerUserInfo, record) => {
                return <div className="deployer">
                    <div>
                        <MetaIdAvatar size={20} avatar={record.deployerUserInfo.avatar} /> {record.deployerUserInfo.name||record.deployerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}
                    </div>
                    <div className="MetaId">
                        MetaID:{record.deployerMetaId.replace(/(\w{4})\w+(\w{5})/, "$1...$2")}
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
            render: (totalMinted) => {
                return <NumberFormat value={totalMinted} />
            }
        },
        {
            title: 'Holders',
            dataIndex: 'holders',
            sorter: true,
            render: (price) => {
                return <NumberFormat value={price} />
            }
        },
        {
            title: 'condition',
            dataIndex: 'qual',
            render: (qual, record) => {
                return <div className="condition"><PopLvl lvl={record.qual.lvl} /> <Tooltip title={record.qual.path}>path:{record.qual.path.replace(/(.{5}).+(.{3})/, "$1...$2")}</Tooltip> <span className="colorPrimary"> X {record.qual.count || '1'}</span></div>
            }
        },
        {
            title: 'Deployed',
            dataIndex: 'deployTime',
            // sorter: true,
            render: (price) => {
                return dayjs(price * 1000).format('MM/DD/YYYY,HH:mm')
            }
        },
        {
            title: 'Progress%',
            dataIndex: 'totalSupply',

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
                    "borderColor": "rgba(240, 240, 240, 0)"
                }
            },
        }}><Table
            style={{ margin: screens.md ? '0 200px' : '0 20px' }}
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
                if (sorter.field === 'holders') {
                    setParams({ ...params, orderBy: 'holders' })
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
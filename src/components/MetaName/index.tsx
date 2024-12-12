import { Button, Input, message, Space, Spin, theme, Typography } from "antd"
import "./index.less"
import _location from "@/assets/location.svg"
import { CloseCircleOutlined, RightOutlined, SearchOutlined } from "@ant-design/icons"
import { useModel } from "umi"
import { useEffect, useState } from "react"
import { createMetaName } from "@/utils/metaName"
import { getMetaNameInfo } from "@/services/api"

export default () => {
    const { token: {
        colorError,
        colorBgElevated

    } } = theme.useToken()
    const [name, setName] = useState<string>();
    const [loading, setLoading] = useState<boolean>(false);
    const [info, setInfo] = useState<API.MetaNameInfo>();
    const [searched, setSearched] = useState<string>('');
    const [historyItems, setHistoryItems] = useState<string[]>([]);
    const { network, btcConnector, feeRate, connected, connect } = useModel("wallet");
    useEffect(()=>{
        const _historyItems = JSON.parse(localStorage.getItem('metaNameHistory') || '[]');
        setHistoryItems(_historyItems);
    },[])

    const handelSearch = async (_name?:string) => {
        console.log('handelSearch')
        const Name = _name || name;
        if (!Name) return
        const Reg = /^[a-zA-Z0-9]{1,64}$/;
        if (!Reg.test(Name)) {
            message.error('Name should be 1-64 characters long and only contain letters and numbers');
            return
        }
        setLoading(true);

        try {
            const ret = await getMetaNameInfo({ name:Name }, network);
            if (ret.data && ret.data.info) {
                setInfo(ret.data.info);
            } else {
                setInfo(undefined);
            }
            setSearched(Name)
            const _historyItems = [Name, ...historyItems.filter(item => item !== Name).slice(0, 4)];
            localStorage.setItem('metaNameHistory', JSON.stringify(_historyItems));
            setHistoryItems(_historyItems);
        } catch (err) {
            console.log(err)
        }
        setLoading(false);

    }
    const handelRegister = async (namespace: string) => {
        if (!connected) {
            return connect();
        }
        if (!btcConnector) return
        if (name) {
            try {
                const ret = await createMetaName(name, btcConnector, feeRate, namespace);
                if (ret) {
                    message.success("Register success");
                } else {
                    message.error("Register failed");
                }
            } catch (err: any) {
                console.log(err)
                message.error(typeof err === 'string' ? err : err.message || 'Register failed');
            }

        }
    }
    return <div className="metaNamePage">
        <Space>
            <img className="icon" src={_location}></img>
            <Typography.Title className="title" level={1}>Own Your Identity</Typography.Title>
        </Space>
        <Typography.Text className="subTitle" type='secondary' >MetaName  Service simplifies your on-chain life</Typography.Text>

        <div className="inputWrap">
            <Input size="large" className="input" variant='borderless' allowClear placeholder="Search for your MetaName" onPressEnter={()=>handelSearch()} value={name} onChange={(e) => {
                setName(e.target.value)
            }} />
            <Button loading={loading} onClick={()=>handelSearch()} className="button" type='primary' shape='circle' icon={<SearchOutlined className="search" />}></Button>
        </div>
        <div className="searchHistorys">
            <Space>
                <Typography.Text className="subTitle" type='secondary' >Recent searches</Typography.Text>
                {historyItems.map((item, index) => {
                    return <Button key={item} color="default" variant="filled" onClick={() => {
                        setName(item);
                        handelSearch(item);
                        
                    }}>{item}</Button>
                })}
            </Space>
        </div>

        {
            searched && <div style={{ width: '100%' }} className="results">
                {
                    info && <div style={{ width: '100%' }}>
                        <div className="resultItem" style={{ borderColor: colorError, borderRadius: 8 }}>
                            <Space>
                                <CloseCircleOutlined style={{ color: colorError }} />
                                <div>
                                    <Typography.Text type='secondary' className="text">@</Typography.Text>
                                    <Typography.Text className="text">{info.fullName} </Typography.Text>
                                </div>
                            </Space>
                            <Typography.Text type='danger' className="text">Taken</Typography.Text>

                        </div>

                    </div>
                }
                {
                    !info && <div style={{ width: '100%' }}>
                        {
                            ['metaid'].map((item, index) => (
                                <div
                                    className="resultItem"
                                    style={{ borderColor: '#000', borderRadius: 8, background: colorBgElevated }}
                                    onClick={() => {
                                        handelRegister(item)
                                    }}
                                >
                                    <Space>
                                        <Typography.Text type='secondary' className="text">@</Typography.Text>
                                        <Typography.Text className="text">{searched}.{item} </Typography.Text>
                                    </Space>
                                    <RightOutlined />

                                </div>
                            ))
                        }

                    </div>
                }
            </div>
        }



    </div>
}
import { Button, Input, message, Space, Spin, theme, Typography } from "antd"
import "./index.less"
import _location from "@/assets/location.svg"
import { CloseCircleOutlined, RightOutlined, SearchOutlined } from "@ant-design/icons"
import { useModel } from "umi"
import { useState } from "react"
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

    const handelSearch = async () => {
        if (!name) return
        const Reg=/^[a-zA-Z0-9]{1,64}$/;
        if(!Reg.test(name)){
            message.error('Name should be 1-64 characters long and only contain letters and numbers');
            return
        }
        setLoading(true);

        try {
            const ret = await getMetaNameInfo({ name }, network);
            if (ret.data && ret.data.info) {
                setInfo(ret.data.info);
            } else {
                setInfo(undefined);
            }
            setSearched(name)
            setHistoryItems([name, ...historyItems.filter(item => item !== name).slice(0, 4)]);
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
            <Input size="large" className="input" variant='borderless' allowClear placeholder="Search for your MetaName" value={name} onChange={(e) => {
                setName(e.target.value)
            }} />
            <Button loading={loading} onClick={handelSearch} className="button" type='primary' shape='circle' icon={<SearchOutlined className="search" />}></Button>
        </div>
        <div className="searchHistorys">
            <Space>
                <Typography.Text className="subTitle" type='secondary' >Recent searches</Typography.Text>
                {historyItems.map((item, index) => {
                    return <Button key={item} color="default" variant="filled" onClick={() => {
                        setName(item);
                        handelSearch();
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
                            ['metaid', 'ord', 'sats', 'btc'].map((item, index) => (
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
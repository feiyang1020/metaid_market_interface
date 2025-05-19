import { ConfigProvider, Tabs, TabsProps, Grid, Input } from "antd"
import AllList from "./AllList";

import "./index.less";
import Minting from "./Minting";
import IdCoins from "./IdCoins";
import { useModel, useNavigate, useMatch } from "umi";
import { useEffect, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { formatMessage } from "@/utils/utlis";
import Trans from "../Trans";
const { useBreakpoint } = Grid;
const items: TabsProps['items'] = [
    {
        key: '0',
        label: <Trans>ID Coins</Trans>,
        children: <IdCoins />,
    },
    {
        key: '1',
        label: <Trans>All Minting</Trans>,
        children: <Minting />,
    },
    {
        key: '2',
        label: <Trans>All Minted</Trans>,
        children: <AllList />,
    },

];
export default () => {
    const screens = useBreakpoint();
    const [activeKey, setActiveKey] = useState('0');
    const nav = useNavigate()
    const match = useMatch('/market/:tab/:mrc20Tab');
    const { searchWord, setSearchWord, setIdCoinPage,setAllPage,setMintingPage } = useModel('mrc20')

    const _tab = match?.params.mrc20Tab;
    useEffect(() => {
        if (_tab) {
            setActiveKey(_tab)
        }
    }, [_tab]);
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
        }}
    >
        <Tabs
            onChange={(item) => {
                nav('/market/MRC-20/' + item, { replace: false })
            }}
            tabBarStyle={{ paddingLeft: screens.lg ? 20 : 0 }}
            className="mrc20ListWrap" activeKey={activeKey}
            defaultActiveKey="0"
            items={items}
            tabBarExtraContent={<div className="search">

                <Input.Search
                    // variant="filled"
                    style={{ borderRadius: 20 }}
                    placeholder={formatMessage("Search...")}
                    // value={searchWord}
                    // onChange={(e) => {
                    //     setIdCoinPage(0)
                    //     setAllPage(0)
                    //     setMintingPage(0)
                    //     setSearchWord(e.target.value)
                    // }}
                    allowClear
                    // enterButton
                     variant="borderless"

                    onSearch={(value) => {
                        setIdCoinPage(0)
                        setAllPage(0)
                        setMintingPage(0)
                        setSearchWord(value)
                    }}
                    onPressEnter={(e) => {
                        setIdCoinPage(0)
                        setAllPage(0)
                        setMintingPage(0)
                        setSearchWord(e.target.value)
                    }}
                    // suffix={
                    //     <SearchOutlined style={{ color: '#D8D8D8' }} />
                    // }
                />
            </div>}
        />
    </ConfigProvider>
}
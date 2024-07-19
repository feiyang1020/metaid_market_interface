import { ConfigProvider, Tabs, TabsProps, Grid } from "antd"
import AllList from "./AllList";

import "./index.less";
import Minting from "./Minting";
import IdCoins from "./IdCoins";
import { useSearchParams, useNavigate, useMatch } from "umi";
import { useEffect, useState } from "react";
const { useBreakpoint } = Grid;
const items: TabsProps['items'] = [
    {
        key: '0',
        label: 'ID Coins',
        children: <IdCoins />,
    },
    {
        key: '1',
        label: 'Minted',
        children: <AllList />,
    },
    {
        key: '2',
        label: 'Minting',
        children: <Minting />,
    },

];
export default () => {
    const screens = useBreakpoint();
    const [activeKey, setActiveKey] = useState('0');
    const nav = useNavigate()
    const match = useMatch('/market/:tab/:mrc20Tab');

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
    ><Tabs onChange={(item) => {
        nav('/market/MRC-20/' + item,{ replace: false })
    }} tabBarStyle={{ paddingLeft: screens.lg ? 20 : 20 }} className="mrc20ListWrap" activeKey={activeKey} defaultActiveKey="0" items={items} /></ConfigProvider>
}
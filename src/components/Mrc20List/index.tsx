import { ConfigProvider, Tabs, TabsProps, Grid } from "antd"
import AllList from "./AllList";

import "./index.less";
import Minting from "./Minting";
import IdCoins from "./IdCoins";
import { useSearchParams, useNavigate, useResolvedPath } from "umi";
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
    const [query] = useSearchParams();
    const _tab = query.get("mt");
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
        nav({ search: `?tab=MRC-20&mt=${item}` })
    }} tabBarStyle={{ paddingLeft: screens.lg ? 20 : 20 }} className="mrc20ListWrap" activeKey={activeKey} defaultActiveKey="0" items={items} /></ConfigProvider>
}
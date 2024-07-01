import { ConfigProvider, Tabs, TabsProps, Grid } from "antd"
import AllList from "./AllList";

import "./index.less";
import Minting from "./Minting";
const { useBreakpoint } = Grid;
const items: TabsProps['items'] = [
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
    ><Tabs tabBarStyle={{ paddingLeft: screens.lg ? 20 : 20 }} className="mrc20ListWrap" defaultActiveKey="1" items={items} /></ConfigProvider>
}
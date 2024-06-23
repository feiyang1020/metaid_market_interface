import { ConfigProvider, Tabs, TabsProps, Grid } from "antd"
import AllList from "./AllList";

import "./index.less";
const { useBreakpoint } = Grid;
const items: TabsProps['items'] = [
    {
        key: '1',
        label: 'All',
        children: <AllList />,
    },
    {
        key: '2',
        label: 'Minting',
        children: 'Content of Tab Pane 2',
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
    ><Tabs tabBarStyle={{ paddingLeft: screens.md ? 200 : 20 }} className="mrc20ListWrap" defaultActiveKey="1" items={items} /></ConfigProvider>
}
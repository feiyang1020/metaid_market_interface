import { ConfigProvider, Tabs } from "antd";
import Trans from "../Trans";
import { FireFilled, ThunderboltFilled } from "@ant-design/icons";
import HOT from "./HOT";
import "./index.less";

export default () => {

    const items = [
        {
            key: 'hot',
            label: <Trans>HOT</Trans>,
            children: <HOT type='hot' />,
            icon: <FireFilled />,
        },
        {
            key: 'new',
            label: <Trans>NEW</Trans>,
            children: <HOT type='new' />,
            icon: <ThunderboltFilled />,
        }
    ]
    return <ConfigProvider
        theme={{
            token: {
                colorBorderSecondary: 'transparent',
            },
            components: {
                Tabs: {
                    inkBarColor: 'transparent',
                },
            },
        }}
    >
        <Tabs
            defaultActiveKey="hot"
            items={items}
            className="hot-and-new-tabs"
            style={{ marginBottom: 20 }}
        />
    </ConfigProvider>
}
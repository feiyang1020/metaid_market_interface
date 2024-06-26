import { ArrowLeftOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Space, Table, TableProps, Tooltip, message } from "antd";

import "./index.less";
import { useState } from "react";
import Deploy from "./components/Deploy";
import Mint from "./components/Mint";
import Transfer from "./components/Transfer";
type Tab = "Deploy" | "Mint" | "Transfer";
const items = ["Deploy", 'Mint', 'Transfer'];
export default () => {

    const [tab, setTab] = useState<Tab>("Deploy");

    return (
        <div className="deployHistoryPage animation-slide-bottom">
            <div
                className="title"
                onClick={() => {
                    history.back();
                }}
            >
                <LeftOutlined />
            </div>

            <div className="tabs">
                <Space>
                    {items.map((item) => (
                        <Button
                            key={item}
                            type={tab === item ? "link" : "text"}
                            onClick={() => setTab(item)}
                            size="large"
                        >
                            {item}
                        </Button>
                    ))}
                </Space>
            </div>
            <div>
                {tab === 'Deploy' && <Deploy />}
                {tab === 'Mint' && <Mint />}
                {tab === 'Transfer' && <Transfer />}
            </div>

        </div>
    );
};

import MRC20Icon from "@/components/MRC20Icon"
import { Card, Descriptions, Tooltip, Typography } from "antd"
type Props = {
    mintMrc20Info: API.MRC20TickInfo
}
export default ({ mintMrc20Info }: Props) => {
    return <Card bordered={false} style={{ marginBottom: 20 }} >
        <div>
            <MRC20Icon size={80} tick={mintMrc20Info.tick} metadata={mintMrc20Info.metaData} />
            <div className="tickName">
                <span>{mintMrc20Info.tick}</span> {mintMrc20Info.tokenName && <span>({mintMrc20Info.tokenName}) </span>}
            </div>
            <div className="tokenId">
                <Typography.Text className="token" copyable={{ text: mintMrc20Info.mrc20Id }}>Token ID: {mintMrc20Info.mrc20Id.replace(/(\w{4})\w+(\w{5})/, "$1...$2")}</Typography.Text>
            </div>
        </div>
        <Descriptions column={1}
            labelStyle={{ color: '#FFFFFF' }}
            contentStyle={{ flexGrow: 1, justifyContent: 'flex-end', color: 'rgba(255, 255, 255, 0.5)' }}
            items={[
                {
                    key: 'Ticker',
                    label: 'Ticker',
                    children: <>{mintMrc20Info.tick}</>
                },
                {
                    key: 'tokenName',
                    label: 'Token Name',
                    children: <>{mintMrc20Info.tokenName}</>
                },
                {
                    key: 'mintCount',
                    label: 'Mint Count',
                    children: <>{mintMrc20Info.mintCount}</>
                },
                {
                    key: 'amtPerMint',
                    label: 'Amount Per Mint',
                    children: <>{mintMrc20Info.amtPerMint}</>
                },
                {
                    key: 'Path',
                    label: 'Path',
                    children: <Tooltip title={mintMrc20Info.qual.path}>{mintMrc20Info.qual.path.replace(/(.{6}).+(.{5})/, "$1...$2")}</Tooltip>
                },
                {
                    key: 'Difficultylevel',
                    label: 'Difficulty Level',
                    children: <>{mintMrc20Info.qual.lvl || '--'}</>
                },
                {
                    key: 'Count',
                    label: 'Count',
                    children: <>{mintMrc20Info.qual.count || '--'}</>
                }
            ]}></Descriptions>
    </Card>
}
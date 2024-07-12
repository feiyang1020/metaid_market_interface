import MRC20Icon from "@/components/MRC20Icon"
import MetaIdAvatar from "@/components/MetaIdAvatar"
import NumberFormat from "@/components/NumberFormat"
import { QuestionCircleOutlined } from "@ant-design/icons"
import { Card, Descriptions, Tooltip, Typography } from "antd"
type Props = {
    mintMrc20Info: API.MRC20TickInfo
}
export default ({ mintMrc20Info }: Props) => {
    return <Card bordered={false} style={{ marginBottom: 20 }} className="mrc20CardInfo">
        <div className="tokenInfo">
            <MRC20Icon size={80} tick={mintMrc20Info.tick} metadata={mintMrc20Info.metaData} />
            <div className="tickName">
                <span>{mintMrc20Info.tick}</span> {mintMrc20Info.tokenName && <span>({mintMrc20Info.tokenName}) </span>}
                {/* <Tooltip title="Token">
                    <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                </Tooltip> */}
            </div>
            <div className="tokenId">
                <Typography.Text className="token" copyable={{ text: mintMrc20Info.mrc20Id, }}>Token ID: {mintMrc20Info.mrc20Id.replace(/(\w{4})\w+(\w{5})/, "$1...$2")}</Typography.Text>
            </div>
        </div>
        <Descriptions column={1}
            labelStyle={{ color: '#FFFFFF', display: 'flex', alignItems: 'center' }}
            contentStyle={{ flexGrow: 1, justifyContent: 'flex-end', color: 'rgba(255, 255, 255, 0.5)' }}
            items={[
                {
                    key: 'Deployer',
                    label: 'Deployer',
                    children: <div className="deployer">
                        <div className="deployerInfo">
                            <MetaIdAvatar size={20} avatar={mintMrc20Info.deployerUserInfo.avatar} /><div className="deployerName">{mintMrc20Info.deployerUserInfo.name || mintMrc20Info.deployerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}</div>
                        </div>
                        <div className="MetaId">
                            MetaID:{mintMrc20Info.deployerMetaId.replace(/(\w{6})\w+(\w{5})/, "$1...")}
                        </div>
                    </div>
                },

                {
                    key: 'mintCount',
                    label: 'Max Mint Count',
                    children: <>{mintMrc20Info.mintCount}</>
                },
                {
                    key: 'amtPerMint',
                    label: 'Amount Per Mint',
                    children: <>{mintMrc20Info.amtPerMint}</>
                },
                {
                    key: 'mc',
                    label: <span>Market Cap <Tooltip title={<p>Market Capitalization = Current Price x Circulating Supply <br></br> The total market value of the cryptocurrency's circulating supply.</p>}> <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} /></Tooltip> </span>,
                    children: <NumberFormat value={mintMrc20Info.amtPerMint} isBig decimal={8} suffix=' BTC' />
                },
                {
                    key: 'totalSupply',
                    label: <span>Total Supply <Tooltip title={<p>The total amount of tokens that have been created, minus any tokens that have been burned (taken out of circulation).<br />Total Supply = In-Chain Supply - Burned Tokens.</p>}> <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} /></Tooltip> </span>,
                    children: <NumberFormat value={mintMrc20Info.totalSupply} />
                },
                {
                    key: 'Decimals',
                    label: 'Decimals',
                    children: <>{mintMrc20Info.decimals}</>
                },
                {
                    key: 'PremineCount',
                    label: 'Premine Count',
                    children: <>{mintMrc20Info.premineCount}</>
                },
                {
                    key: 'Path',
                    label: 'Path',
                    children: <Tooltip title={mintMrc20Info.pinCheck.path}>{mintMrc20Info.pinCheck.path.replace(/(.{6}).+(.{5})/, "$1...$2")}</Tooltip>
                },
                {
                    key: 'Difficultylevel',
                    label: 'Difficulty Level',
                    children: <>{mintMrc20Info.pinCheck.lvl || '--'}</>
                },
                {
                    key: 'Count',
                    label: 'Count',
                    children: <>{mintMrc20Info.pinCheck.count || '--'}</>
                }
            ]}></Descriptions>
    </Card>
}


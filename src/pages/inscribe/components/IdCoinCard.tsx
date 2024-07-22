import { useModel } from "umi"
import IdCoinMessage from "@/components/IdCoinMessage"
import MRC20Icon from "@/components/MRC20Icon"
import MetaIdAvatar from "@/components/MetaIdAvatar"
import NumberFormat from "@/components/NumberFormat"
import { ArrowRightOutlined, QuestionCircleOutlined } from "@ant-design/icons"
import { Card, Descriptions, Tooltip, Typography } from "antd"
type Props = {
    mintMrc20Info: API.IdCoin
}
export default ({ mintMrc20Info }: Props) => {
    const { network } = useModel('wallet')
    return <><Card style={{ marginBottom: 20, border: '1px solid #FF8B13' }} className="mrc20CardInfo">
        <div className="idCoinDeploy">
            <MetaIdAvatar size={72} avatar={mintMrc20Info.deployerUserInfo.avatar} />
            <div className="rightIndfo">
                <div className="name">{mintMrc20Info.deployerUserInfo.name || mintMrc20Info.deployerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2")} <a onClick={(e) => e.stopPropagation()} href={`${network === 'mainnet' ? 'https://www.bitbuzz.io' : 'https://bitbuzz-testnet.vercel.app'}/profile/${mintMrc20Info.deployerAddress}`} target='_blank'>
                    <ArrowRightOutlined style={{ color: '#fff', transform: 'rotate(-0.125turn)' }} />
                </a></div>
                <div className="metaid"><Typography.Text copyable={{ text: mintMrc20Info.deployerMetaId }}>MetaID : {mintMrc20Info.deployerMetaId.replace(/(\w{6})\w+(\w{5})/, "$1...")}</Typography.Text> </div>

            </div>
        </div>
        <Descriptions column={1}
            labelStyle={{ color: '#FFFFFF', display: 'flex', alignItems: 'center' }}
            contentStyle={{ flexGrow: 1, justifyContent: 'flex-end', color: 'rgba(255, 255, 255, 0.5)' }}
            items={[
                // {
                //     key: 'Deployer',
                //     label: 'Deployer',
                //     children: <div className="deployer">
                //         <div className="deployerInfo">
                //             <MetaIdAvatar size={20} avatar={mintMrc20Info.deployerUserInfo.avatar} /><div className="deployerName">{mintMrc20Info.deployerUserInfo.name || mintMrc20Info.deployerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}</div>
                //         </div>
                //         <div className="MetaId">
                //             MetaID:{mintMrc20Info.deployerMetaId.replace(/(\w{6})\w+(\w{5})/, "$1...")}
                //         </div>
                //     </div>
                // },
                {
                    key: 'Ticker',
                    label: 'Ticker',
                    children: <span style={{ color: '#F68819', fontWeight: 'bold' }}>{mintMrc20Info.tick}</span>
                },

                {
                    key: 'Follow',
                    label: <span>Followers Limit <Tooltip title={<p>Followers Limit：Limit on the total number of followers. The minimum number of followers is 1, while the maximum number can reach 1,000,000,000,000（1e12）</p>}> <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} /></Tooltip> </span>,
                    children: <NumberFormat value={mintMrc20Info.followersLimit} />
                },
                {
                    key: 'amtPerMint',
                    label: 'Amount Per Mint',
                    children: <NumberFormat value={mintMrc20Info.amtPerMint} />
                },
                {
                    key: 'totalSupply',
                    label: <span>Total Supply <Tooltip title={<p>The total amount of tokens that have been created, minus any tokens that have been burned (taken out of circulation).<br />Total Supply = In-Chain Supply - Burned Tokens.</p>}> <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} /></Tooltip> </span>,
                    children: <NumberFormat value={mintMrc20Info.totalSupply} />
                },
                // {
                //     key: 'Foliqllow',
                //     label: 'Liquidity Per Mint',
                //     children: <NumberFormat value={mintMrc20Info.liquidityPerMint} suffix={' BTC'} isBig decimal={8} />
                // },
                // {
                //     key: 'mc',
                //     label: <span>Market Cap <Tooltip title={<p>Market Capitalization = Current Price x Circulating Supply <br></br> The total market value of the cryptocurrency's circulating supply.</p>}> <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} /></Tooltip> </span>,
                //     children: <NumberFormat value={mintMrc20Info.amtPerMint} isBig decimal={8} suffix=' BTC' />
                // },

                {
                    key: 'Pool',
                    label: 'Pool',
                    children: <NumberFormat value={mintMrc20Info.pool} />
                },
                {
                    key: 'Message',
                    label: 'Message',
                    children: <IdCoinMessage info={mintMrc20Info.metaData}></IdCoinMessage>

                },
                {
                    key: 'Foliqllow',
                    label: <span>Liquidity Per Mint <Tooltip title={<p>Liquidity Per Mint：The amount of liquidity required for each transaction. The minimum liquidity requirement is 1,200 stat, with a maximum liquidity supply of 1,000,000,000,000 (1e12)</p>}> <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} /></Tooltip> </span>,
                    children: <NumberFormat value={mintMrc20Info.liquidityPerMint} suffix={' BTC'} isBig decimal={8} />
                },
                // {
                //     key: 'Decimals',
                //     label: 'Decimals',
                //     children: <>{mintMrc20Info.decimals}</>
                // },
                // {
                //     key: 'PremineCount',
                //     label: 'Premine Count',
                //     children: <>{mintMrc20Info.premineCount}</>
                // },
                // {
                //     key: 'Path',
                //     label: 'Path',
                //     children: <Tooltip title={mintMrc20Info.pinCheck.path}>{mintMrc20Info.pinCheck.path.replace(/(.{6}).+(.{5})/, "$1...$2")}</Tooltip>
                // },
                // {
                //     key: 'Difficultylevel',
                //     label: 'Difficulty Level',
                //     children: <>{mintMrc20Info.pinCheck.lvl || '--'}</>
                // },
                // {
                //     key: 'Count',
                //     label: 'Count',
                //     children: <>{mintMrc20Info.pinCheck.count || '--'}</>
                // }
            ]}></Descriptions>
    </Card>
       
    </>
}


import MRC20Icon from "@/components/MRC20Icon";
import NumberFormat from "@/components/NumberFormat";
import Popup from "@/components/ResponPopup";
import Mrc20 from "@/pages/mrc20";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Collapse, Divider, Space, Tooltip } from "antd";
import { useModel, useSearchParams, history } from "umi";
import './index.less'
import Trans from "@/components/Trans";
type MRC20DeployParams = {
    tick: string
    tokenName: string
    decimals: string
    amtPerMint: string
    mintCount: string
    premineCount: string
    blockheight: string
    metadata?: string
    beginHeight?: string
    endHeight?: string
    payCheck: {
        payTo?: string
        payAmount?: string
    }
    pinCheck: {
        creator?: string
        path?: string
        count?: string
        lvl?: string
    }
}
export type DeployComfirmProps = {
    show: boolean;
    submiting: boolean;
    onConfirm: () => Promise<void>;
    onClose: () => void;
    deployInfo: MRC20DeployParams;
    fees?: API.DeployMRC20PreRes & { commintGas: number }
}

export const defaultDeployComfirmProps: DeployComfirmProps = {
    show: false,
    submiting: false,
    onConfirm: async () => { },
    onClose: () => { },
    deployInfo: {
        tick: '',
        tokenName: '',
        decimals: '',
        amtPerMint: '',
        mintCount: '',
        premineCount: '',
        blockheight: '',
        pinCheck: {},
        payCheck: {},
        beginHeight: '',
        endHeight: '',
    } as MRC20DeployParams,


}
const DescItem = ({ label, value, dark, style = {} }: { label: React.ReactNode, dark?: boolean, value: React.ReactNode, style?: React.CSSProperties }) => {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 0', ...style }}>
        <div style={{ fontSize: '16px', color: dark ? 'rgba(255, 255, 255, 0.5)' : '#fff' }}>{label}</div>
        <div style={{ fontSize: '16px' }}>{value}</div>
    </div>
}
export default function DeployComfirm({ show, onClose, onConfirm, submiting, deployInfo, fees }: DeployComfirmProps) {
    const { userBal, avatar, userName, metaid } =
        useModel("wallet");
    if (!fees) return <></>

    const items = [
        {
            key: 1,
            label: <DescItem dark style={{ padding: 0 }} label={<Space><Trans>Gas</Trans>  <Tooltip title={<Trans>Gas = Commit Gas + Reveal Gas</Trans>}> <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} /></Tooltip></Space>} value={<NumberFormat value={Number(fees.commintGas) + Number(fees.minerGas)} isBig decimal={8} suffix=' BTC' minDig={8} />} />,
            children: <div>
                <DescItem dark label={<Trans>Commit Gas</Trans>} value={<NumberFormat value={fees.commintGas} isBig decimal={8} minDig={8} suffix=' BTC' />} />
                <DescItem dark label={<Trans>Reveal Gas</Trans>} value={<NumberFormat value={Number(fees.minerGas)} isBig decimal={8} minDig={8} suffix=' BTC' />} />

            </div>
        },

    ]
    return <Popup show={show} onClose={onClose} closable title={<Trans>Deploy</Trans>} className="deployComfirm">
        <DescItem label={<Trans>Ticker</Trans>} value={deployInfo.tick} />
        <DescItem label={<Trans>Token Name</Trans>} value={deployInfo.tokenName} />
        <DescItem label={<Trans>Mint Limit</Trans>} value={deployInfo.mintCount} />
        <DescItem label={<Trans>Amount Per Mint</Trans>} value={deployInfo.amtPerMint} />

        <DescItem label={<Trans>Icon</Trans>} value={<MRC20Icon {...deployInfo}></MRC20Icon>} />

        <DescItem label={<Trans>Decimals</Trans>} value={deployInfo.decimals} />
        {
            deployInfo.premineCount && <DescItem label={<Trans>Premine Count</Trans>} value={deployInfo.premineCount} />
        }
        {
            deployInfo.beginHeight && <DescItem label={<Trans>Begin Height</Trans>} value={deployInfo.beginHeight} />
        }
        {
            deployInfo.endHeight && <DescItem label={<Trans>End Height</Trans>} value={deployInfo.endHeight} />
        }
        {
            deployInfo.payCheck.payTo && <DescItem label={<Trans>Pay To</Trans>} value={<Tooltip title={deployInfo.payCheck.payTo}>{deployInfo.payCheck.payTo.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}</Tooltip>} />
        }
        {
            deployInfo.payCheck.payAmount && <DescItem label={<Trans>Pay Amount</Trans>} value={<NumberFormat value={deployInfo.payCheck.payAmount} isBig decimal={8} suffix=" BTC" />} />
        }

        {
            deployInfo.pinCheck.creator && <DescItem label={<Trans>Creator</Trans>} value={<Tooltip title={deployInfo.pinCheck.creator}>{deployInfo.pinCheck.creator.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}</Tooltip>} />
        }

        {
            deployInfo.pinCheck.path && <DescItem label={<Trans>Path</Trans>} value={deployInfo.pinCheck.path} />
        }
        {
            deployInfo.pinCheck.count && <DescItem label={<Trans>Count</Trans>} value={deployInfo.pinCheck.count} />
        }
        {
            deployInfo.pinCheck.lvl && <DescItem label={<Trans>Difficulty Level</Trans>} value={deployInfo.pinCheck.lvl} />
        }
        <Divider style={{ margin: '2px 0' }} />
        <Collapse ghost items={items} style={{ width: '100%' }} />
        {/* <DescItem dark label="Miner Out Value" value={<NumberFormat value={fees.minerOutValue} isBig decimal={8} minDig={8} suffix=' BTC' />} /> */}
        <DescItem dark label={<Trans>Service Fee</Trans>} value={<NumberFormat value={fees.serviceFee} isBig decimal={8} suffix=' BTC' minDig={8} />} />
        <Divider style={{ margin: '2px 0' }} />
        <DescItem label={<Trans>You Will Spend</Trans>} value={<NumberFormat value={Number(fees.totalFee) + Number(fees.commintGas) - fees.minerOutValue} isBig decimal={8} minDig={8} suffix=' BTC' />} />
        <DescItem label={<Trans>Available Balance</Trans>} value={<NumberFormat value={userBal} suffix=' BTC' minDig={8} />} />
        <Button block size='large' type="primary" style={{ marginTop: 28 }} onClick={onConfirm} loading={submiting}>{<Trans>Confirm</Trans>}</Button>
    </Popup>
}
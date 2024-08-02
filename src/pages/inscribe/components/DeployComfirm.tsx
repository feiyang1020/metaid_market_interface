import MRC20Icon from "@/components/MRC20Icon";
import NumberFormat from "@/components/NumberFormat";
import Popup from "@/components/ResponPopup";
import Mrc20 from "@/pages/mrc20";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Collapse, Divider, Space, Tooltip } from "antd";
import { useModel, useSearchParams, history } from "umi";
import  './index.less'
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
export default function DeployComfirm({ show, onClose, onConfirm, submiting, deployInfo,fees }: DeployComfirmProps) {
    const { userBal, avatar, userName, metaid } =
    useModel("wallet");
    if(!fees) return <></>

    const items = [
        {
            key: 1,
            label: <DescItem dark style={{ padding: 0 }} label={<Space> Gas <Tooltip title="Gas = Commit Gas + Reveal Gas"> <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} /></Tooltip></Space>} value={<NumberFormat value={Number(fees.commintGas) + Number(fees.minerGas)} isBig decimal={8} suffix=' BTC' minDig={8} />} />,
            children: <div>
                <DescItem dark label="Commit Gas" value={<NumberFormat value={fees.commintGas} isBig decimal={8} minDig={8} suffix=' BTC' />} />
                <DescItem dark label="Reveal Gas" value={<NumberFormat value={Number(fees.minerGas)} isBig decimal={8} minDig={8} suffix=' BTC' />} />
                
            </div>
        },

    ]
    return <Popup show={show} onClose={onClose} closable title='Deploy' className="deployComfirm">
        <DescItem label='Ticker' value={deployInfo.tick} />
        <DescItem label='Token Name' value={deployInfo.tokenName} />
        <DescItem label='Mint Limit' value={deployInfo.mintCount} />
        <DescItem label='Amount Per Mint' value={deployInfo.amtPerMint} />

        <DescItem label='Icon' value={<MRC20Icon {...deployInfo}></MRC20Icon>} />

        <DescItem label='Decimals' value={deployInfo.decimals} />
        {
            deployInfo.premineCount && <DescItem label='Premine Count' value={deployInfo.premineCount} />
        }
        {
            deployInfo.beginHeight && <DescItem label='Begin Height' value={deployInfo.beginHeight} />
        }
        {
            deployInfo.endHeight && <DescItem label='End Height' value={deployInfo.endHeight} />
        }
        {
            deployInfo.payCheck.payTo && <DescItem label='Pay To' value={<Tooltip title={deployInfo.payCheck.payTo}>{deployInfo.payCheck.payTo.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}</Tooltip>} />
        }
        {
            deployInfo.payCheck.payAmount && <DescItem label='Pay Amount' value={<NumberFormat value={deployInfo.payCheck.payAmount} isBig decimal={8} suffix=" BTC" />} />
        }

        {
            deployInfo.pinCheck.creator && <DescItem label='Creator' value={<Tooltip title={deployInfo.pinCheck.creator}>{deployInfo.pinCheck.creator.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}</Tooltip>} />
        }

        {
            deployInfo.pinCheck.path && <DescItem label='Path' value={deployInfo.pinCheck.path} />
        }
        {
            deployInfo.pinCheck.count && <DescItem label='Count' value={deployInfo.pinCheck.count} />
        }
        {
            deployInfo.pinCheck.lvl && <DescItem label='Difficulty Level' value={deployInfo.pinCheck.lvl} />
        }
        <Divider style={{ margin: '2px 0' }} />
        <Collapse ghost items={items} style={{ width: '100%' }} />
        <DescItem dark label="Miner Out Value" value={<NumberFormat value={fees.minerOutValue} isBig decimal={8} minDig={8} suffix=' BTC' />} />
        <DescItem dark label="Service Fee" value={<NumberFormat value={fees.serviceFee} isBig decimal={8} suffix=' BTC' minDig={8} />} />
        <Divider style={{ margin: '2px 0' }} />
        <DescItem label="You Will Spend" value={<NumberFormat value={Number(fees.totalFee) + Number(fees.commintGas)} isBig decimal={8} minDig={8} suffix=' BTC' />} />
        <DescItem label="Available Balance" value={<NumberFormat value={userBal} suffix=' BTC' minDig={8} />} />
        <Button block size='large' type="primary" style={{ marginTop: 28 }} onClick={onConfirm} loading={submiting}>Confirm</Button>
    </Popup>
}
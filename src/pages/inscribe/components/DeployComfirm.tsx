import MRC20Icon from "@/components/MRC20Icon";
import Popup from "@/components/ResponPopup";
import Mrc20 from "@/pages/mrc20";
import { Button, Tooltip } from "antd";
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
    } as MRC20DeployParams

}
const DescItem = ({ label, value }: { label: string, value: React.ReactNode }) => {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
        <div style={{ fontSize: '16px' }}>{label}</div>
        <div style={{ fontSize: '16px', }}>{value}</div>
    </div>
}
export default function DeployComfirm({ show, onClose, onConfirm, submiting, deployInfo }: DeployComfirmProps) {
    return <Popup show={show} onClose={onClose} closable title='Deploy'>
        <DescItem label='Ticker' value={deployInfo.tick} />
        <DescItem label='Token Name' value={deployInfo.tokenName} />
        <DescItem label='Max Mint Count' value={deployInfo.mintCount} />
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
            deployInfo.payCheck.payAmount && <DescItem label='Pay To' value={deployInfo.payCheck.payAmount} />
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
        <Button block size='large' type="primary" style={{ marginTop: 28 }} onClick={onConfirm} loading={submiting}>Confirm</Button>
    </Popup>
}
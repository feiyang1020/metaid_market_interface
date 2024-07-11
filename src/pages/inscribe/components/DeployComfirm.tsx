import MRC20Icon from "@/components/MRC20Icon";
import Popup from "@/components/ResponPopup";
import Mrc20 from "@/pages/mrc20";
import { Button } from "antd";
type MRC20DeployParams = {
    tick: string
    tokenName: string
    decimals: string
    amtPerMint: string
    mintCount: string
    premineCount: string
    blockheight: string
    metadata?: string
    pinCheck: {
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
        pinCheck: {}
    } as MRC20DeployParams

}
const DescItem = ({ label, value }: { label: string, value: React.ReactNode }) => {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
        <div style={{ fontSize: '16px' }}>{label}</div>
        <div style={{ fontSize: '16px' }}>{value}</div>
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
import { Avatar, Typography, Grid } from "antd"
import MRC20Icon from "../MRC20Icon"
import MetaIdAvatar from "../MetaIdAvatar"
import { useMemo } from "react";
const { useBreakpoint } = Grid;
export default ({ info }: { info: API.MRC20Info }) => {
    const screens = useBreakpoint();
    const tokenId = useMemo(() => {
        if(screens.xl){
            return info.mrc20Id.replace(/(\w{4})\w+(\w{5})/, "$1...$2")
        }
        return info.mrc20Id.replace(/(\w{4})\w+(\w{3})/, "$1...")
    }, [info.mrc20Id, screens])
    return <div className="mrc20-item">
        {
            info.tag === 'id-coins' ? <MetaIdAvatar size={40} avatar={info.deployerUserInfo && info.deployerUserInfo.avatar} /> : <MRC20Icon tick={info.tick} metadata={info.metaData} />
        }

        <div className="tick">
            <div className="tickName" style={{ color: info.tag === 'id-coins' ? '#F68819' : '#fff' }}>
                {info.tick}
            </div>

            <Typography.Text className="token" copyable={{ text: info.mrc20Id }}>TokenID: {tokenId}</Typography.Text>
        </div>
    </div>
}
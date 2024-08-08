import { Avatar, Typography } from "antd"
import MRC20Icon from "../MRC20Icon"
import MetaIdAvatar from "../MetaIdAvatar"

export default ({ info }: { info: API.MRC20Info }) => {
    return <div className="mrc20-item">
        {
            info.tag === 'id-coins' ? <MetaIdAvatar size={40} avatar={info.deployerUserInfo && info.deployerUserInfo.avatar} /> : <MRC20Icon tick={info.tick} metadata={info.metaData} />
        }

        <div className="tick">
            <div className="tickName" style={{ color: info.tag === 'id-coins' ? '#F68819' : '#fff' }}>
                {info.tick}
            </div>

            <Typography.Text className="token" copyable={{ text: info.mrc20Id }}>TokenID: {info.mrc20Id.replace(/(\w{4})\w+(\w{5})/, "$1...$2")}</Typography.Text>


        </div>
    </div>
}
import { Avatar, Typography } from "antd"
import MRC20Icon from "../MRC20Icon"
import MetaIdAvatar from "../MetaIdAvatar"

export default ({ info }: { info: { avatar: string, tick: string, tickId: string } }) => {
    return <div className="mrc20-item">
        <MetaIdAvatar avatar={info.avatar} />
        <div className="tick">
            <div className="tickName">
                {info.tick}
            </div>

            <Typography.Text className="token" copyable={{ text: info.tickId }}>TokenID: {info.tickId.replace(/(\w{4})\w+(\w{5})/, "$1...$2")}</Typography.Text>


        </div>
    </div>
}
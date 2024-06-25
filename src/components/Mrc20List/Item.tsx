import { Avatar, Typography } from "antd"
import MRC20Icon from "../MRC20Icon"

export default ({ info }: { info: API.MRC20Info }) => {
    return <div className="mrc20-item">
        <MRC20Icon tick={info.tick} />
        <div className="tick">
            <div className="tickName">
                {info.tick}
            </div>

            <Typography.Text className="token" copyable={{ text: info.mrc20Id }}>TokenID: {info.mrc20Id.replace(/(\w{4})\w+(\w{5})/, "$1...$2")}</Typography.Text>


        </div>
    </div>
}
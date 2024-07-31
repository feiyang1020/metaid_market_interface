import { useModel } from "umi";
import MetaIdAvatar from "../MetaIdAvatar";
import { getMetaIdUrlByNet } from "@/config";
import "./index.less";

type Props = {
    avatar: string;
    name: string;
    metaid: string;
    address: string;
    avatarSize?: number;
    className?: string;
}
export default ({ avatar, avatarSize = 72, name, address, metaid, className = '' }: Props) => {
    const { network } = useModel('wallet')
    return <div className={"metaidUserWrapCom " + className} onClick={() => window.open(getMetaIdUrlByNet(network) + metaid, '_blank')}>
        <MetaIdAvatar avatar={avatar} size={avatarSize} />
        <div className="nameWrap">
            <div className="name">
                {name || address.replace(/(\w{5})\w+(\w{5})/, "$1...$2")}
            </div>
            <div className="metaid">
                Metaid: {metaid.replace(/(\w{6})\w+(\w{5})/, "$1...")}
            </div>

        </div>
    </div>
}
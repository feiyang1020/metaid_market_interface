import { Button, Card, Divider, Progress, Space, Tooltip } from "antd"
import MetaIdAvatar from "../MetaIdAvatar";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useModel, history } from "umi";
import NumberFormat from "../NumberFormat";
import './index.less'
import Item from "./Item";
import Trans from "../Trans";
type Props = {
    record: API.MRC20Info

}
export default ({ record, }: Props) => {



    return <Card className="IdCoinCard" bordered={false} style={{ background: '#101110', borderRadius: 16 }} styles={{ body: { padding: '12px 18px' } }} onClick={() => {
        history.push(`/${record.tag === 'id-coins' ? 'idCoin' : 'mrc20'}/${record.tick}`)
    }} >
        <div className="top">
            <div className="topLeft">
                <Item info={record} />
            </div>
            <div className="topRight">

            </div>
        </div>
        <Divider />
        <div className="bottom">
            <div className="bottomLeft">
                <div className="item">
                    <div className="label "><Trans>Price</Trans></div>
                    <div className="value "><NumberFormat tiny value={record.price} isBig decimal={8} suffix=' BTC' /></div>
                </div>
                <div className="item">
                    <div className="label"><Trans>Change 24H</Trans></div>
                    <div className="value" style={{ color: record.change24h[0] !== '-' ? '#40BA68' : '#B94041' }}>{record.change24h}</div>
                </div>

            </div>
            <div className="bottomRight">
                <div className="item">
                    <div className="label"> <Trans>Total Supply</Trans></div>
                    <div className="value"><NumberFormat value={record.totalSupply} /></div>
                </div>
                <div className="item">
                    <div className="label"><Trans>Market Cap</Trans></div>
                    <div className="value"><NumberFormat value={record.marketCap} decimal={8} isBig suffix=' BTC' /></div>
                </div>
            </div>
        </div>

    </Card>
}
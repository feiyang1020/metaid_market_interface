import { Button, Card, Divider, Progress, Space, Tooltip } from "antd"
import MetaIdAvatar from "../MetaIdAvatar";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useModel, history } from "umi";
import NumberFormat from "../NumberFormat";
import './index.less'
import Item from "./Item";
import PopLvl from "../PopLvl";
import Trans from "../Trans";
type Props = {
    record: API.MRC20Info

}
export default ({ record, }: Props) => {

    const percent = Number(record.supply / record.totalSupply) * 100 || 0;
    const rate = Number(record.premineCount) / Number(record.mintCount) * 100

    return <Card className="IdCoinCard" bordered={false} style={{ background: '#101110', borderRadius: 16 }} styles={{ body: { padding: '12px 18px' } }} onClick={() => {
        history.push(`/${record.tag === 'id-coins' ? 'idCoin' : 'mrc20'}/${record.tick}`)
    }} >
        <div className="top">
            <div className="topLeft">
                <Item info={record} />
            </div>
            <div className="topRight">
                <div className="progress ">
                    <NumberFormat value={percent} floor precision={2} suffix='%' />
                    <Progress className="Progress" percent={percent > 1 ? percent : 1} showInfo={false}>

                    </Progress>
                </div>
                <Space>
                    <Button size='small' style={{ fontSize: 12 }} type='link'> {
                        Number(record.premineCount) === 0 ? <Trans>Fair Launch</Trans> :
                            rate < 1 ? '<1%' : <NumberFormat value={rate} floor suffix='%' precision={4} />

                    }</Button>
                    <Button size='small' style={{ fontSize: 12 }} disabled={!record.mintable} onClick={(e) => { e.stopPropagation(); history.push('/inscribe/MRC-20/' + record.tick) }} type='primary'><Trans>Mint</Trans></Button>
                </Space>
            </div>
        </div>
        <Divider />
        <div className="bottom">
            <div className="bottomLeft">
                <div className="item">
                    <div className="label "><Trans>Deloyer</Trans></div>
                    <div className="value "><div className="deployerInfo">
                        <MetaIdAvatar size={16} avatar={record.deployerUserInfo.avatar} /><div className="deployerName">{record.deployerUserInfo.name || record.deployerAddress.replace(/(\w{5})\w+(\w{3})/, "$1...$2")}</div>
                    </div></div>
                </div>
                <div className="item">
                    <div className="label"><Trans>Holders</Trans></div>
                    <div className="value" ><NumberFormat value={record.holders} /></div>
                </div>

            </div>
            <div className="bottomRight">
                <div className="item">
                    <div className="label"> <Trans>Mnited</Trans></div>
                    <div className="value"><NumberFormat value={record.totalMinted} /></div>
                </div>
                <div className="item">
                    <div className="label"><Trans>Condition</Trans></div>
                    <div className="value"><div className="condition"><div>
                        {record.pinCheck.path && <Tooltip title={record.pinCheck.path}>path:{record.pinCheck.path.length > 10 ? record.pinCheck.path.replace(/(.{4}).+(.{5})/, "$1...$2") : record.pinCheck.path}</Tooltip>}</div> <div className="lvlCount"><PopLvl lvl={record.pinCheck.lvl} />  <span className="colorPrimary"> x {record.pinCheck.count || '0'}</span></div></div></div>
                </div>
            </div>
        </div>

    </Card>
}
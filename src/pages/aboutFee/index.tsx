import NumberFormat from "@/components/NumberFormat";
import { LeftOutlined } from "@ant-design/icons";
import { Descriptions } from "antd"
import "./index.less";

export default () => {
    return <div className="AboutFeesPage animation-slide-bottom">
        <div
            className="backTitle"
            onClick={() => {
                history.back();
            }}
        >
            <LeftOutlined /> About Fees
        </div>
        <div style={{ fontSize: 18, fontWeight: 'bold', margin: '28px' }}>Metaid.Market Fee</div>
        <Descriptions style={{
            border: '1px solid #D4F66B',
            borderRadius: 16,
            overflow: 'hidden',
            width: 994,
            maxWidth: 'calc(100vw - 40px)',
        }} bordered title="Service Fee" column={1} items={[
            {
                key: '1',
                label: 'Deploy ID-Coins',
                children: <div><NumberFormat value={1999} isBig decimal={8} suffix=' BTC' /></div>
            },
            {
                key: '2',
                label: 'Deploy MRC-20',
                children: <div><NumberFormat value={1999} isBig decimal={8} suffix=' BTC' /></div>
            },
            {
                key: '3',
                label: 'Mint ID-Coins',
                children: <div><NumberFormat value={1999} isBig decimal={8} suffix=' BTC' /></div>
            },
            // {
            //     key: '3',
            //     label: 'Mint ID-Coins',
            //     children: <div><NumberFormat value={1999} isBig decimal={8} suffix=' BTC' /></div>
            // },
            {
                key: '4',
                label: 'Follow And Mint ID-Coins',
                children: <div><NumberFormat value={1999} isBig decimal={8} suffix=' BTC' /></div>
            },
            {
                key: '5',
                label: 'Follow ',
                children: <div><NumberFormat value={0} isBig decimal={8} suffix=' BTC' /></div>
            },
            {
                key: '6',
                label: 'Mint MRC-20',
                children: <div><NumberFormat value={1999} isBig decimal={8} suffix=' BTC' /></div>
            },
            {
                key: '7',
                label: 'List MRC-20',
                children: <div><NumberFormat value={0} isBig decimal={8} suffix=' BTC' /></div>
            },
            {
                key: '8',
                label: 'Inscribe File/Pin/Buzz',
                children: <div><NumberFormat value={1999} isBig decimal={8} suffix=' BTC' /></div>
            },
            {
                key: '8',
                label: 'Buy MRC-20/Pin/ID-Coins',
                children: <div>No service fee is charged for transactions less than 300,000 satoshis. For transactions equal to or greater than 300,000 satoshis, a 0.6% service fee is charged, collected from the buyer.</div>
            },
            {
                key: '8',
                label: 'Transfer MRC-20',
                children: <div><NumberFormat value={0} isBig decimal={8} suffix=' BTC' /></div>
            },
            {
                key: '8',
                label: 'Redeem',
                children: <div><NumberFormat value={0} isBig decimal={8} suffix=' BTC' /></div>
            },
            {
                key: '8',
                label: 'Refund',
                children: <div><NumberFormat value={0} isBig decimal={8} suffix=' BTC' /></div>
            },
            {
                key: '8',
                label: 'Set Profile',
                children: <div><NumberFormat value={0} isBig decimal={8} suffix=' BTC' /></div>
            },
        ]} />
    </div>
}
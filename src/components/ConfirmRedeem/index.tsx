import { Button, ConfigProvider, Descriptions } from "antd";
import Popup from "../ResponPopup";
import NumberFormat from "../NumberFormat";
import './index.less'

type Props = {
    show: boolean;
    onClose: () => void;
    goOrders: () => void;
    handelRedeem: () => Promise<void>;
    idCoin: API.IdCoin;
    amount: number;
    btcPrice: number;
}
export default ({ show, onClose, goOrders, idCoin, amount, btcPrice, handelRedeem }: Props) => {
    return <Popup
        title=''
        modalWidth={452}
        show={show}
        onClose={onClose}
        closable={true}
        bodyStyle={{ padding: "28px 25px" }}
        className="redeemModal"
    >
        <div className="modelTitle">
            Confirm Redeem Liquidity
        </div>
        <div className="tip">You are about to destroy your ID Coin to redeem liquidity. This operation is irreversible and your ID Coin will be burned.</div>
        <div className="cardComfire">
            <div className="title">
                Do you confirm?
            </div>
            <Descriptions column={1}
                labelStyle={{ color: '#FFFFFF', display: 'flex', alignItems: 'center' }}
                contentStyle={{ flexGrow: 1, justifyContent: 'flex-end', color: 'rgba(255, 255, 255, 0.5)' }}
                items={[

                    {
                        key: 'Ticker',
                        label: 'Burn ID Coin',
                        children: <span style={{ color: '#F68819', fontWeight: 'bold' }}>{idCoin.tick}</span>
                    },


                    {
                        key: 'btcPrice',
                        label: 'Amount',
                        children: <NumberFormat value={amount} />
                    },

                    {
                        key: 'Pool',
                        label: 'Redeem BTC',
                        children: <NumberFormat value={btcPrice} decimal={8} isBig suffix=' BTC' />
                    },

                ]}></Descriptions>
        </div>
        <div className="tip2">
            Alternatively, you can go to Orders.exchange to trade at more reasonable prices.
        </div>

        <ConfigProvider
            theme={{
                components: {
                    Button: {
                        "defaultBorderColor": "rgb(212, 246, 107)",
                        "defaultColor": "rgb(212, 246, 107)"
                    },
                },
            }}
        >
            <Button onClick={goOrders} size='large' block style={{ marginTop: 35 }}>
                Go To Orders.Exchange
            </Button>
        </ConfigProvider>
        <Button type="primary" onClick={handelRedeem} size='large' style={{ marginTop: 20 }} block>
            Confiirm Redeem
        </Button>
    </Popup>
}
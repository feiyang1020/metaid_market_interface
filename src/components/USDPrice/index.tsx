import Decimal from "decimal.js";
import { useMemo } from "react";
import { useModel } from "umi";
import NumberFormat from "../NumberFormat";
import { Typography } from "antd";

type Props = {
    value: number | string;
    decimals?: number;
    chain?: API.Chain; // 'btc' | 'doge'
}
export default ({ value, decimals = 0, chain = 'btc' }: Props) => {
    const { btcPrice, dogePrice } = useModel("wallet")
    const usdPrice = useMemo(() => {
        const price = chain === 'doge' ? dogePrice : btcPrice;
        return new Decimal(value).mul(price).toNumber()
    }, [btcPrice, dogePrice, value, chain])
    return <Typography.Text type='secondary'><NumberFormat value={usdPrice} isBig decimal={decimals} precision={2} prefix='$' /></Typography.Text>
}
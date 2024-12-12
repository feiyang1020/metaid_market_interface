import Decimal from "decimal.js";
import { useMemo } from "react";
import { useModel } from "umi";
import NumberFormat from "../NumberFormat";
import { Typography } from "antd";

type Props = {
    value: number | string;
    decimals?: number;
}
export default ({ value, decimals = 0 }: Props) => {
    const { btcPrice } = useModel("wallet")
    const usdPrice = useMemo(() => {
        return new Decimal(value).mul(btcPrice).toNumber()
    }, [btcPrice, value])
    return <Typography.Text type='secondary'><NumberFormat value={usdPrice} isBig decimal={decimals} precision={2} prefix='$' /></Typography.Text>
}
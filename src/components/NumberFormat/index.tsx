import { bigint2Number, formatNumberToKMBT } from "@/utils/utlis";
import { Tooltip } from "antd"
import { BigNumber } from 'bignumber.js';
import { useMemo } from "react";
import { useIntl } from "umi";



type Props = {
    value: string | number | BigNumber ,
    prefix?: React.ReactNode,
    suffix?: React.ReactNode,
    precision?: number,
    loading?: boolean,
    group?: boolean,
    kmt?: boolean,
    isBig?: boolean,
    decimal?: number,
    tiny?: boolean
}

const NumberFormat: React.FC<Props> = (props) => {
    const { formatNumber } = useIntl()
    const { prefix, suffix, } = props;

    const beautyNumber = useMemo(() => {
        const { value, precision = 10, kmt, isBig = false, decimal, tiny = false } = props;

        let _value = value
        if (Number.isNaN(Number(_value))) return '--'
        if (isBig && decimal) {
            _value = bigint2Number(new BigNumber(_value), decimal)
        }
        try {
            if (tiny && Number(_value) < 0.000001 && Number(_value) > 0) {
                let string = String(parseFloat(String(_value)));
                let ret = string.replace('.', '').match(/(\d+)e-(\d+)/);
                let left = '';
                let dex = ''
                if (ret && (ret[1] && ret[2])) {
                    left = ret[1].substring(0, precision)
                    dex = String(Number(ret[2]) - 1)
                }
                return { type: 'tiny', left: left, dex }
            }
        } catch (err) {
            return '--'
        }


        if (kmt) {
            return formatNumberToKMBT(Number(_value), precision)
        } else {
            return formatNumber(Number(_value), { maximumFractionDigits: precision, minimumFractionDigits: 0 })
        }
    }, [props])


    return <>
        {prefix}{typeof beautyNumber === 'string' ? beautyNumber : <>0.0<span style={{ fontSize: '0.8em', top: "0.2em", position: "relative" }}>
            {beautyNumber.dex}
        </span>{beautyNumber.left}
        </>}{suffix}
    </>
}

export default NumberFormat
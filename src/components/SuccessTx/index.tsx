import { useModel } from "umi";
import { Tooltip, Typography } from "antd";

type Props = {
    txs: {
        label: string;
        txid: string;
    }[];
}
export default ({ txs }: Props) => {
    const { network } = useModel('wallet')
    return <>
        {
            txs.map(({ label, txid }, index) => {
                return <div className="item">
                    <div className="label">{label}</div>
                    <div className="value">
                        <Tooltip title={txid}>
                            <a
                                style={{ color: "#fff", textDecoration: "underline" }}
                                target="_blank"
                                href={
                                    network === "testnet"
                                        ? `https://mempool.space/testnet/tx/${txid}`
                                        : `https://mempool.space/tx/${txid}`
                                }
                            >
                                <Typography.Text copyable={{ text: txid }}>
                                    {txid.replace(/(\w{5})\w+(\w{5})/, "$1...$2")}
                                </Typography.Text>
                            </a>
                        </Tooltip>
                    </div>
                </div>
            })
        }
    </>
}
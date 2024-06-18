import { Button, Col, Form, Grid, Input, Radio, Row } from "antd";
import { useState } from "react";
const { useBreakpoint } = Grid;
import { useModel } from "umi";
import "./index.less";
import SeleceFeeRateItem from "./SeleceFeeRateItem";
import { mintMrc20Commit, mintMrc20Pre } from "@/services/api";
import { SIGHASH_ALL, getPkScriprt } from "@/utils/orders";
import { commitMintMRC20PSBT, mintRevealPrePsbtRaw } from "@/utils/mrc20";
import { Psbt, networks } from "bitcoinjs-lib";
const formItemLayout = {
    labelCol: {
        xs: { span: 24 },
        sm: { span: 4 },
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 20 },
    },
};
export default () => {
    const { sm } = useBreakpoint();
    const [form] = Form.useForm();
    const [submiting, setSubmiting] = useState(false);
    const { authParams, connected, connect, feeRates, network, disConnect, btcAddress } =
        useModel("wallet");
    const { orders, loading, updateOrders, setLoading } = useModel("sale");
    const mint = async () => {
        if (!connected || !btcAddress) return;
        await form.validateFields();
        const { type, feeRate } = form.getFieldsValue();
        try {
            if (type === 'mint') {
                if (orders.length === 0) return
                const { code, message, data } = await mintMrc20Pre(network, {
                    mintPins: [
                        {
                            pinId: orders[0].assetId,
                            pinUxtoTxId: orders[0].utxoId.split("_")[0],
                            pinUxtoIndex: Number(orders[0].utxoId.split("_")[1]),
                            pinUtxoOutValue: 546,
                            address: btcAddress,
                            pkScript: getPkScriprt(btcAddress, network).toString('hex'),
                        }
                    ], networkFeeRate: feeRate, outAddress: btcAddress, outValue: 546, tickerId: '8e659899275b1d06db870fbee9b293bc73d25e063cc86860a6d52c1e11091e9bi0'
                }, {
                    headers: {
                        ...authParams,
                    },
                });
                if (code !== 0) throw new Error(message);
                const { rawTx, revealPrePsbtRaw } = await commitMintMRC20PSBT(data, feeRate, btcAddress, network,orders[0].utxoId.split("_")[0]);
                // const revealPrePsbtRaw = await mintRevealPrePsbtRaw(data, feeRate, btcAddress, network,txId,orders[0].utxoId.split("_")[0]);

                console.log(revealPrePsbtRaw, 'revealPrePsbtRaw');
                await mintMrc20Commit(network, { orderId: data.orderId, commitTxRaw: rawTx, commitTxOutIndex: 0, revealPrePsbtRaw }, { headers: { ...authParams } })
            }
        } catch (e) {
            console.error(e);
        }


    }
    return <div className="mrc20Form">
        <Form
            {...formItemLayout}
            variant="filled"
            style={{ maxWidth: "96vw", width: 632 }}
            initialValues={{

            }}
            form={form}
        >
            <Form.Item label="Type" name="type">
                <Radio.Group className="customRadio">
                    <Radio value="deploy" className="customRadioItem">Deploy</Radio>
                    <Radio value="mint" className="customRadioItem">Mint</Radio>
                    <Radio value="transfer" className="customRadioItem">Transfer</Radio>
                </Radio.Group>
            </Form.Item>
            <Form.Item label="Path" name="path">
                <Input
                    size="large"
                />
            </Form.Item>

            <Form.Item label="FeeRate" name="feeRate">
                <SeleceFeeRateItem feeRates={feeRates} />
            </Form.Item>





        </Form>

        <Row gutter={[0, 0]}>
            <Col offset={sm ? 4 : 0} span={sm ? 20 : 24}>
                {!connected ? (
                    <Button
                        block
                        className="submit"
                        size="large"
                        type="primary"
                        onClick={connect}
                    >
                        Connect Wallet
                    </Button>
                ) : (
                    <Button
                        block
                        size="large"
                        loading={submiting}
                        type="primary"
                        onClick={mint}

                        className="submit"
                    >
                        Next
                    </Button>
                )}
            </Col>
        </Row>
    </div>

} 
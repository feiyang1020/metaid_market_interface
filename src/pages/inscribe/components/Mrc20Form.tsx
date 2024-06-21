import { Button, Card, Checkbox, Col, Descriptions, Form, Grid, Input, InputNumber, Radio, Row, Spin } from "antd";
import { useCallback, useEffect, useState } from "react";
const { useBreakpoint } = Grid;
import { useModel } from "umi";
import "./index.less";
import SeleceFeeRateItem from "./SeleceFeeRateItem";
import { getMrc20AddressShovel, getMrc20Info, mintMrc20Commit, mintMrc20Pre, transferMrc20Commit, transfertMrc20Pre } from "@/services/api";
import { SIGHASH_ALL, getPkScriprt } from "@/utils/orders";
import { commitMintMRC20PSBT, mintRevealPrePsbtRaw, transferMRC20PSBT } from "@/utils/mrc20";
import { Psbt, networks } from "bitcoinjs-lib";
import level from "@/assets/level.svg";
const formItemLayout = {
    labelCol: {
        xs: { span: 24 },
        sm: { span: 5 },
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 19 },
    },
};
export default () => {
    const { sm } = useBreakpoint();
    const [form] = Form.useForm();
    const [mintTokenID, setMintTokenID] = useState<string>('');
    const [mintInfoLoading, setMintInfoLoading] = useState(false);
    const [mintInfoStatus, setMintInfoStatus] = useState('');
    const [mintMrc20Info, setMintMrc20Info] = useState<API.MRC20TickInfo>();
    const [shovel, setShowel] = useState<API.MRC20Shovel[]>();
    const [submiting, setSubmiting] = useState(false);
    const { authParams, connected, connect, feeRates, network, disConnect, btcAddress } =
        useModel("wallet");
    const { orders, loading, updateOrders, setLoading } = useModel("sale");

    const handleMintTokenIDChange = (e) => {
        setMintTokenID(e.target.value);
    };

    const fetchMrc20Info = useCallback(async () => {
        if (!mintTokenID) return;
        setMintInfoLoading(true)
        setMintInfoStatus('validating')
        const { code, message, data } = await getMrc20Info(network, { tickId: mintTokenID });
        await fetchShovels();
        setMintInfoLoading(false)
        if (data && data.mrc20Id) {
            setMintMrc20Info(data);
            setMintInfoStatus('success')
            return
        }

        setMintInfoStatus('error')
        setMintMrc20Info(undefined)

    }, [mintTokenID])

    const fetchShovels = useCallback(async () => {
        if (!btcAddress || !mintTokenID) return;
        const { code, message, data } = await getMrc20AddressShovel(network, { tickId: mintTokenID, address: btcAddress, cursor: 0, size: 100 });
        console.log(data, 'data');
        setShowel(data.list)
    }, [btcAddress, mintTokenID])

    useEffect(() => {
        fetchMrc20Info()
    }, [fetchMrc20Info])

    const mint = async () => {
        if (!connected || !btcAddress) return;
        await form.validateFields();
        const { type, feeRate,tickerId,pins } = form.getFieldsValue();
        // const tickerId = '8e659899275b1d06db870fbee9b293bc73d25e063cc86860a6d52c1e11091e9bi0'
        try {
            if (type === 'mint') {
                const mintPins=pins.map((pinId)=>{
                    const pin= shovel?.find(item=>item.id===pinId);
                    if(!pin)return;
                    return {
                        pinId: pin.id,
                        pinUtxoTxId: pin.location.split(":")[0],
                        pinUtxoIndex: Number(pin.location.split(":")[1]),
                        pinUtxoOutValue: pin.outputValue,
                        address: btcAddress,
                        pkScript: getPkScriprt(btcAddress, network).toString('hex'),
                    }
                })
                const { code, message, data, } = await mintMrc20Pre(network, {
                    mintPins: mintPins, networkFeeRate: feeRate, outAddress: btcAddress, outValue: 546, tickerId,
                }, {
                    headers: {
                        ...authParams,
                    },
                });
                if (code !== 0) throw new Error(message);
                const { rawTx, revealPrePsbtRaw } = await commitMintMRC20PSBT(data, feeRate, btcAddress, network);
                // const revealPrePsbtRaw = await mintRevealPrePsbtRaw(data, feeRate, btcAddress, network,txId,orders[0].utxoId.split("_")[0]);

                console.log(revealPrePsbtRaw, 'revealPrePsbtRaw');
                await mintMrc20Commit(network, { orderId: data.orderId, commitTxRaw: rawTx, commitTxOutIndex: 0, revealPrePsbtRaw }, { headers: { ...authParams } })
            }
            if (type === 'transfer') {
                const amount = "200";
                const recipient = 'mwKUTvJF43BqGqANeVdrtpRwd2zxNFvnWQ'
                const params: API.TransferMRC20PreReq = {
                    networkFeeRate: feeRate,
                    tickerId,
                    changeAddress: btcAddress,
                    changeOutValue: 546,
                    transfers: [{
                        utxoIndex: 1,
                        utxoTxId: '2a3062f0fd388a526ccef6ed35aba3a670408032845a5e630dae1c1cdf4db5ba',
                        utxoOutValue: 546,
                        tickerId,
                        amount: '1000',
                        address: btcAddress,
                        pkScript: getPkScriprt(btcAddress, network).toString('hex')
                    }],
                    mrc20Outs: [{ amount, address: recipient, outValue: 546, pkScript: getPkScriprt(recipient, network).toString('hex') }]
                }

                const { code, message, data } = await transfertMrc20Pre(network, params, {
                    headers: {
                        ...authParams,
                    },
                })
                if (code !== 0) throw new Error(message);

                const { rawTx, revealPrePsbtRaw } = await transferMRC20PSBT(data, feeRate, btcAddress, network);
                console.log(revealPrePsbtRaw, 'revealPrePsbtRaw', rawTx);
                await transferMrc20Commit(network, { orderId: data.orderId, commitTxRaw: rawTx, commitTxOutIndex: 0, revealPrePsbtRaw }, { headers: { ...authParams } })
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
                type: 'transfer',
            }}
            form={form}
        >
            <Form.Item label="Type" name="type" rules={[{ required: true }]}>
                <Radio.Group className="customRadio">
                    <Radio value="deploy" className="customRadioItem">Deploy</Radio>
                    <Radio value="mint" className="customRadioItem">Mint</Radio>
                    <Radio value="transfer" className="customRadioItem">Transfer</Radio>
                </Radio.Group>
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
                {
                    ({ getFieldValue }) => {
                        const type = getFieldValue('type');
                        if (type === 'transfer') {
                            return <>
                                <Form.Item label="Amount" name="amount">
                                    <InputNumber
                                        size="large"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                                <Form.Item label="Recipient address" name="recipient">
                                    <Input
                                        size="large"
                                    />
                                </Form.Item></>
                        }
                        if (type === 'mint') {
                            return <>

                                <Form.Item label="Token ID" name="tickerId" validateStatus={mintInfoStatus}
                                    help={mintInfoStatus === 'error' ? <div style={{ textAlign: 'left' }}>This token ID does not correspond to any MRC 20; Please re-enter.</div> : <></>} >
                                    <Input
                                        size="large"
                                        onBlur={handleMintTokenIDChange}
                                    />
                                </Form.Item>
                                <Row gutter={[0, 0]}>
                                    <Col offset={sm ? 5 : 0} span={sm ? 19 : 24}> <Spin spinning={mintInfoLoading}>
                                        <div style={{ color: 'var(--primary)' }}>Detail</div>
                                        {
                                            mintMrc20Info && <Card bordered={false}>
                                                <Descriptions column={1}
                                                    labelStyle={{ color: '#FFFFFF' }}
                                                    contentStyle={{ flexGrow: 1, justifyContent: 'flex-end', color: 'rgba(255, 255, 255, 0.5)' }}
                                                    items={[
                                                        {
                                                            key: 'Ticker',
                                                            label: 'Ticker',
                                                            children: <>{mintMrc20Info.tick}</>
                                                        },
                                                        {
                                                            key: 'tokenName',
                                                            label: 'Token Name',
                                                            children: <>{mintMrc20Info.tokenName}</>
                                                        },
                                                        {
                                                            key: 'mintCount',
                                                            label: 'Mint Count',
                                                            children: <>{mintMrc20Info.mintCount}</>
                                                        },
                                                        {
                                                            key: 'amtPerMint',
                                                            label: 'Amount per Mint',
                                                            children: <>{mintMrc20Info.amtPerMint}</>
                                                        }
                                                    ]}></Descriptions>
                                            </Card>
                                        }
                                    </Spin>
                                    </Col>
                                </Row>
                                <Form.Item label="PINs" name="pins"
                                    help={mintInfoStatus === 'error' ? <div style={{ textAlign: 'left' }}>This token ID does not correspond to any MRC 20; Please re-enter.</div> : <></>} >
                                    <Checkbox.Group>
                                        <Row>
                                            {shovel?.map(item => {
                                                return <Col span={24} key={item.id}><Checkbox className="customCheckbox" value={item.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexDirection:'row-reverse'}}>
                                                    <div className="value">#{item.number} <div className="level">
                                                    {String(item.popLv) !== "--" && item.pop !== "--" ? (
                                                        <>
                                                            <img src={level} alt="" />
                                                            {item.popLv}
                                                        </>
                                                    ) : (
                                                        <span>--</span>
                                                    )}</div>
                                                </div></Checkbox></Col>
                                            })}

                                        </Row></Checkbox.Group>
                                </Form.Item>
                            </>
                        }
                        return null;
                    }
                }
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
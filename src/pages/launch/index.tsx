import { Col, Form, Input, Row, Grid, Button, InputNumber, message, Tooltip, Typography, Spin } from 'antd';
import './index.less'
import { useModel, useSearchParams, history } from "umi";
import MetaIdAvatar from '@/components/MetaIdAvatar';
import { useEffect, useMemo, useState } from 'react';
import NumberFormat from '@/components/NumberFormat';
import SetProfile from '@/components/SetProfile';
import SeleceFeeRateItem from '../inscribe/components/SeleceFeeRateItem';
import { deployIdCoinCommit, deployIdCoinPre, getIdCoinInfo } from '@/services/api';
import { buildDeployIdCointPsbt } from '@/utils/idcoin';
import { testnet } from 'bitcoinjs-lib/src/networks';
import { addUtxoSafe } from '@/utils/psbtBuild';
import SuccessModal, { DefaultSuccessProps, SuccessProps } from '@/components/SuccessModal';
import { EditFilled, InfoCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
const { useBreakpoint } = Grid;
export default () => {
    const [form] = Form.useForm();
    const _followersNum = Form.useWatch('followersNum', form);
    const _amountPerMint = Form.useWatch('amountPerMint', form);
    const _liquidityPerMint = Form.useWatch('liquidityPerMint', form);
    const [successProp, setSuccessProp] =
        useState<SuccessProps>(DefaultSuccessProps);
    const totalSupply = useMemo(() => {
        if (_amountPerMint && _followersNum) {
            return BigInt(Math.round(_amountPerMint)) * BigInt(Math.round(_followersNum))
        } else {
            return BigInt(0)
        }
    }, [_followersNum, _amountPerMint])

    const InitialPrice = useMemo(() => {
        if (_amountPerMint && _liquidityPerMint) {
            return BigInt(Math.round(_liquidityPerMint)) / BigInt(Math.round(_amountPerMint))
        } else {
            return BigInt(0)
        }
    }, [_liquidityPerMint, _amountPerMint])
    const { sm } = useBreakpoint();
    const [visible, setVisible] = useState(false);
    const [editVisible, setEidtVisible] = useState(false);
    const { authParams, connected, connect, feeRates, network, initializing, btcConnector, btcAddress, avatar, userName, metaid } =
        useModel("wallet");
    const [submiting, setSubmiting] = useState<boolean>(false);
    const launch = async () => {
        if (!connected || !metaid || !btcAddress) return;
        if (!userName) {
            setVisible(true);
            return;
        }

        await form.validateFields();
        setSubmiting(true);

        try {
            const { feeRate, tick, description, followersNum, amountPerMint, liquidityPerMint } = form.getFieldsValue();
            const tickExist = await getIdCoinInfo(network, { issuerAddress: btcAddress });
            if (tickExist.code === 0 && tickExist.data.mrc20Id) {
                throw new Error('You have already launched an ID-Coin. Please do not launch it again.')
            }
            const issuerSign: any = await window.metaidwallet.btc.signMessage(tick)
            if (issuerSign.status) throw new Error(issuerSign.status)
            const payload: API.DeployIdCoinPreReq = {
                networkFeeRate: feeRate,
                tick,
                tokenName: tick,
                description,
                issuerMetaId: metaid,
                issuerAddress: btcAddress,
                issuerSign: issuerSign,
                message: description,
                followersNum,
                amountPerMint,
                liquidityPerMint
            }
            const { code, data, message: msg } = await deployIdCoinPre(network, payload, { headers: authParams });
            if (code !== 0) throw new Error(msg);
            const { rawTx } = await buildDeployIdCointPsbt(
                data,
                feeRate,
                btcAddress,
                network
            )
            const commitRes = await deployIdCoinCommit(network, {
                orderId: data.orderId,
                commitTxOutIndex: 0,
                commitTxRaw: rawTx,
            }, { headers: authParams })
            console.log(commitRes)
            if (commitRes.code !== 0) throw new Error(commitRes.message)
            await addUtxoSafe(btcAddress, [{ txId: commitRes.data.commitTxId, vout: 1 }])
            // message.success('Successfully launched')
            setSuccessProp({
                show: true,
                onClose: () => {
                    setSuccessProp(DefaultSuccessProps);
                    form.resetFields();
                },
                onDown: () => {
                    setSuccessProp(DefaultSuccessProps);
                    form.resetFields();
                    history.push('/mrc20History?tab=ID-Coins Deploy')

                },
                title: "Deploy",
                tip: "Successful",
                okText: 'OK',
                children: (
                    <div className="inscribeSuccess">
                        <div className="res">


                            <div className="item">
                                <div className="label">TxId </div>
                                <div className="value">
                                    <Tooltip title={commitRes.data.revealTxId}>
                                        <a
                                            style={{ color: "#fff", textDecoration: "underline" }}
                                            target="_blank"
                                            href={
                                                network === "testnet"
                                                    ? `https://mempool.space/testnet/tx/${commitRes.data.revealTxId}`
                                                    : `https://mempool.space/tx/${commitRes.data.revealTxId}`
                                            }
                                        >
                                            <Typography.Text copyable={{ text: commitRes.data.revealTxId }}>
                                                {commitRes.data.revealTxId.replace(/(\w{5})\w+(\w{5})/, "$1...$2")}
                                            </Typography.Text>

                                        </a>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                        <div className="tips">
                            <InfoCircleOutlined />
                            <span>Current deployment transaction status is Pending. Please wait for the deployment transaction to be confirmed before minting this token.</span>
                        </div>
                    </div>
                ),
            });

        } catch (err) {
            message.error(err.message)
        }
        setSubmiting(false);
    }

    useEffect(() => {
        if (!initializing && connected) {
            if (!userName) {
                setVisible(true)
            }
        }
    }, [connected, userName, initializing])
    return <div className="launchPage">
        <Spin spinning={initializing}>
            <div className="user">
                <div className='userAvatar'>
                    <MetaIdAvatar avatar={avatar} size={124} />
                    {
                        (connected && !initializing) && <div className='mask' onClick={() => { setEidtVisible(true) }}>
                            <EditFilled />
                        </div>
                    }


                </div>

                <div className="name">{userName || 'Unnamed'}</div>
                <div className="metaid">Metaid:{metaid ? metaid.replace(/(\w{6})\w+(\w{3})/, "$1...") : '--'}</div>
            </div>
        </Spin>
        <Form
            labelCol={{ span: 24 }}
            wrapperCol={{ span: 24 }}
            form={form}
            layout="vertical"
            requiredMark='optional'
            variant="borderless"
            className='formWrap'
            initialValues={{
                // tick: 'Ocean',
                // followersNum: 1000,
                amountPerMint: 21000000,
                liquidityPerMint: 1200,
                // description: "come on!"
            }}
        >

            <Row gutter={[24, 0]}>
                <Col md={12} xs={24} >
                    <Form.Item label="Ticker" name='tick' rules={[{ required: true }]} className='formItem'>
                        <Input placeholder="input ticker" value={'21,000,000'} />
                    </Form.Item>
                </Col>
                <Col md={12} xs={24} >
                    <Form.Item label="Followers Limit" name='followersNum' rules={[{ required: true }]} className='formItem'>
                        <InputNumber placeholder="Followers Limit" style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
                <Col md={12} xs={24} >
                    <Form.Item label="Amount Per Mint" name='amountPerMint' rules={[{ required: true }, { max: 1000000000000, min: 1, type: 'number', message: 'Amount of tokens minted per transaction. Min: 1, Max: 1,000,000,000,000 （1e12).' }]} className='formItem'>
                        <InputNumber placeholder="Amount Per Mint" style={{ width: '100%' }} addonAfter={
                            <Tooltip title="Amount of tokens minted per transaction. Min: 1, Max: 1,000,000,000,000 （1e12).">
                                <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                            </Tooltip>
                        } />

                    </Form.Item>
                    <div className='totalSupply'> Total Supply: <NumberFormat value={totalSupply} isBig decimal={0} /></div>

                </Col>
                <Col md={12} xs={24} >
                    <Form.Item label="Liquidity Per Mint" name='liquidityPerMint' rules={[{ required: true }]} className='formItem'>
                        <InputNumber placeholder="Liquidity Per Mint" style={{ width: '100%' }} />
                    </Form.Item>
                    <div className='totalSupply'> Initial Price   <NumberFormat value={InitialPrice} isBig decimal={0} suffix=' stas' /></div>
                </Col>
                <Col md={24} xs={24} >
                    <Form.Item label="Message" name='description' className='formItem' >
                        <Input placeholder="Leave your message to your followers." />
                    </Form.Item>
                </Col>
                <Col md={24} xs={24} >
                    <Form.Item label="FeeRate" required name='feeRate' className="formItem">
                        <SeleceFeeRateItem feeRates={feeRates} />
                    </Form.Item>
                </Col>
                <Col offset={sm ? 6 : 0} span={sm ? 12 : 24}>
                    {!connected ? (
                        <Button
                            block
                            className="submit"
                            size="large"
                            type="primary"
                            onClick={connect}
                            style={{ height: 60 }}
                        >
                            Connect Wallet
                        </Button>
                    ) : (
                        <Button
                            block
                            size="large"
                            loading={submiting}
                            type="primary"
                            onClick={launch}
                            style={{ height: 60 }}
                            className="submit"

                        >
                            Launch
                        </Button>
                    )}
                </Col>
            </Row>

        </Form>
        <SetProfile show={visible} editVisible={editVisible} setEditVisible={() => { setVisible(false); setEidtVisible(true) }} onClose={() => { setVisible(false); setEidtVisible(false) }} />
        <SuccessModal {...successProp}></SuccessModal>
    </div>
}
import { Col, Form, Input, Row, Grid, Button, InputNumber, message, Tooltip, Typography, Spin, Modal } from 'antd';
import './index.less'
import { useModel, useSearchParams, history } from "umi";
import MetaIdAvatar from '@/components/MetaIdAvatar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import NumberFormat from '@/components/NumberFormat';
import SetProfile from '@/components/SetProfile';
import SeleceFeeRateItem from '../inscribe/components/SeleceFeeRateItem';
import { deployIdCoinCommit, deployIdCoinPre, getIdCoinInfo } from '@/services/api';
import { buildDeployIdCointPsbt } from '@/utils/idcoin';
import { testnet } from 'bitcoinjs-lib/src/networks';
import { addUtxoSafe } from '@/utils/psbtBuild';
import SuccessModal, { DefaultSuccessProps, SuccessProps } from '@/components/SuccessModal';
import { EditFilled, InfoCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import ComfirmLaunch from './components/ComfirmLaunch';
import IdCoinDetail from './components/IdCoinDetail';
import CustomizeRequiredMark from '@/components/CustomReqMark';
const { useBreakpoint } = Grid;
export default () => {
    const [form] = Form.useForm();
    const [comfirmVisible, setComfirmVisible] = useState(false)
    const _followersNum = Form.useWatch('followersNum', form);
    const _amountPerMint = Form.useWatch('amountPerMint', form);
    const _liquidityPerMint = Form.useWatch('liquidityPerMint', form);
    const [order, setOrder] = useState<API.DeployIdCoinPreRes>();
    const [fields, setFields] = useState<{
        tick: string,
        followersNum: number,
        amountPerMint: number,
        liquidityPerMint: number,
    }>();
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
            return Number(_liquidityPerMint) / Number(_amountPerMint)
        } else {
            return BigInt(0)
        }
    }, [_liquidityPerMint, _amountPerMint])
    const { sm } = useBreakpoint();
    const [visible, setVisible] = useState(false);
    const [editVisible, setEidtVisible] = useState(false);
    const { authParams, connected, connect, feeRate, network, initializing, btcConnector, btcAddress, avatar, userName, metaid } =
        useModel("wallet");
    const [submiting, setSubmiting] = useState<boolean>(false);
    //if launched
    const [loading, setLoading] = useState(true)
    const [idCoin, setIDCoin] = useState<API.IdCoin>()
    const fetchOrder = useCallback(async () => {
        if (btcAddress) {
            setLoading(true)
            const tickExist = await getIdCoinInfo(network, { issuerAddress: btcAddress });
            if (tickExist.code === 0) {
                setIDCoin(tickExist.data)
            }
            setLoading(false)
        } else {
            setIDCoin(undefined)
        }
        setLoading(false)
    }, [btcAddress])
    useEffect(() => {
        fetchOrder()
    }, [fetchOrder])

    const launch = async () => {
        if (!connected || !metaid || !btcAddress || !order) return;
        if (!userName) {
            setVisible(true);
            return;
        }

        await form.validateFields();
        setSubmiting(true);

        try {
            const { rawTx } = await buildDeployIdCointPsbt(
                order,
                feeRate,
                btcAddress,
                network
            )
            const commitRes = await deployIdCoinCommit(network, {
                orderId: order.orderId,
                commitTxOutIndex: 0,
                commitTxRaw: rawTx,
            }, { headers: authParams })
            console.log(commitRes)
            if (commitRes.code !== 0) throw new Error(commitRes.message)
            await addUtxoSafe(btcAddress, [{ txId: commitRes.data.commitTxId, vout: Number(order.serviceFee) > 0 ? 2 : 1 }])
            // message.success('Successfully launched')

            setFields(undefined)
            setOrder(undefined)
            fetchOrder()
            setComfirmVisible(false)
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
                title: "Launch",
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

    const launchBefore = async () => {
        if (!connected || !metaid || !btcAddress) return;
        if (!userName) {
            setVisible(true);
            return;
        }
        await form.validateFields();
        try {
            const { tick, description, followersNum, amountPerMint, liquidityPerMint } = form.getFieldsValue();
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
                liquidityPerMint: Number(BigInt(liquidityPerMint * 1e8))
            }
            const { code, data, message: msg } = await deployIdCoinPre(network, payload, { headers: authParams });
            if (code !== 0) throw new Error(msg);
            const { fee } = await buildDeployIdCointPsbt(
                data,
                feeRate,
                btcAddress,
                network,
                false,
                false
            )
            console.log(fee)
            setFields({ tick, followersNum, amountPerMint, liquidityPerMint, gasFee: fee })
            setOrder(data)
            setComfirmVisible(true)
        } catch (err: any) {
            message.error(err.message)
        }
    }

    useEffect(() => {
        if (!btcAddress) {
            form.resetFields()
        }
    }, [btcAddress])

    useEffect(() => {
        if (!initializing && connected) {
            if (!userName) {
                setVisible(true)
            } else {
                setVisible(false)
                form.setFieldsValue({ tick: userName })
            }
        }
    }, [connected, userName, initializing])
    return <div className="launchPage">
        <Spin spinning={initializing || loading} style={{ minHeight: '50vh' }}>
            {(initializing || loading) ? <></> : idCoin ? <IdCoinDetail idCoid={idCoin} /> :
                <>
                    <div className="user">
                        <div className='userAvatar'>
                            <MetaIdAvatar avatar={avatar} size={100} />
                            {
                                (connected && !initializing) && <div className='mask' onClick={() => { setEidtVisible(true) }}>
                                    <EditFilled />
                                </div>
                            }


                        </div>

                        <div className="name">{userName || 'Unnamed'}</div>
                        <div className="metaid">Metaid:{metaid ? metaid.replace(/(\w{6})\w+(\w{3})/, "$1...") : '--'}</div>
                    </div>

                    <Form
                        labelCol={{ span: 9 }}
                        wrapperCol={{ span: 15 }}
                        labelAlign='left'
                        form={form}
                        layout="horizontal"
                        requiredMark={CustomizeRequiredMark}
                        variant="borderless"
                        className='formWrap'
                        colon={false}
                        initialValues={{
                            // tick: 'OhMyCoin',
                            followersNum: 1000,
                            amountPerMint: 10000,
                            liquidityPerMint: 0.001,
                            // description: "come on!"
                        }}
                    >

                        <Row gutter={[24, 0]}>
                            <Col md={12} xs={24} >
                                <Form.Item label="Ticker" name='tick'
                                    rules={[{ required: true }, { type: 'string', min: 2, max: 24 }, { pattern: new RegExp(/^[a-zA-Z0-9\-]*$/), message: "No Space or Special Characters Allowed" }, () => ({
                                        async validator(_, value) {
                                            if (!value || value.length < 2) {
                                                return Promise.resolve();
                                            }
                                            const { data } = await getIdCoinInfo(network, { tick: value.toUpperCase() });
                                            if (data && data.mrc20Id) {
                                                return Promise.reject(new Error('This tick already exists.'));
                                            }

                                        },
                                    })]}
                                    validateTrigger="onBlur" className='formItem'>
                                    <Input placeholder="2~24 Charaters" />
                                </Form.Item>
                            </Col>
                            <Col md={12} xs={24} >
                                <Form.Item label="Followers Limit" name='followersNum' rules={[{ required: true }, { type: 'number', min: 1, max: 1000000000000, message: '1-1e12 ' }]} className='formItem'>
                                    <InputNumber precision={0} placeholder="Followers Limit" style={{ width: '100%' }} controls={false} addonAfter={
                                        <Tooltip title="Followers Limit：Limit on the total number of followers. The minimum number of followers is 1, while the maximum number can reach 1,000,000,000,000（1e12）">
                                            <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                        </Tooltip>
                                    } />
                                </Form.Item>
                            </Col>
                            <Col md={12} xs={24} >
                                <Form.Item label="Amount Per Mint" name='amountPerMint' rules={[{ required: true }, { max: 1000000000000, min: 1, type: 'number', message: '1-1e12 ' }]} className='formItem'>
                                    <InputNumber precision={0} placeholder="Amount Per Mint" style={{ width: '100%' }} addonAfter={
                                        <Tooltip title="Amount of tokens minted per transaction. Min: 1, Max: 1,000,000,000,000 （1e12).">
                                            <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                        </Tooltip>
                                    } controls={false} />

                                </Form.Item>
                                <div className='totalSupply'> Total Supply: <NumberFormat value={totalSupply} isBig decimal={0} /></div>

                            </Col>
                            <Col md={12} xs={24} >
                                <Form.Item label="Liquidity Per Mint" name='liquidityPerMint' rules={[{ required: true }, { type: 'number', min: 0.000012, max: 10000, message: '0.000012-10000 ' }]} className='formItem'>
                                    <InputNumber precision={8} formatter={(value) => `${value} BTC`} parser={(value) => value?.replace(' BTC', '') as unknown as number} placeholder="Liquidity Per Mint" style={{ width: '100%' }} controls={false} addonAfter={
                                        <Tooltip title="Liquidity Per Mint：The amount of liquidity required for each transaction. The minimum liquidity requirement is 1,200 stas, with a maximum liquidity supply of 1,000,000,000,000 (1e12)">
                                            <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                        </Tooltip>
                                    } />
                                </Form.Item>
                                <div className='totalSupply'> Initial Price   <NumberFormat value={InitialPrice} isBig decimal={0} suffix=' BTC' /></div>
                            </Col>
                            <Col md={24} xs={24} >
                                <Form.Item label="Message" name='description' className='formItem' >
                                    <Input placeholder="Leave your message to your followers." />
                                </Form.Item>
                            </Col>
                            {/* <Col md={24} xs={24} >
                    <Form.Item label="FeeRate" required name='feeRate' className="formItem">
                        <SeleceFeeRateItem feeRates={feeRates} />
                    </Form.Item>
                </Col> */}
                            <Col span={24}>
                                {!connected ? (
                                    <Button
                                        block
                                        className="submit"
                                        size="large"
                                        type="primary"
                                        onClick={connect}
                                        style={{ height: 48 }}
                                    >
                                        Connect Wallet
                                    </Button>
                                ) : (
                                    <Button
                                        block
                                        size="large"
                                        loading={submiting}
                                        type="primary"
                                        onClick={launchBefore}
                                        style={{ height: 48 }}
                                        className="submit"

                                    >
                                        Launch
                                    </Button>
                                )}
                            </Col>
                        </Row>

                    </Form></>}
        </Spin>
        <SetProfile show={visible} editVisible={editVisible} setEditVisible={() => { setVisible(false); setEidtVisible(true) }} onClose={() => { setVisible(false); setEidtVisible(false) }} />
        <SuccessModal {...successProp}></SuccessModal>
        <ComfirmLaunch show={comfirmVisible} fields={fields} submiting={submiting} handleSubmit={launch} order={order} onClose={() => setComfirmVisible(false)}></ComfirmLaunch>
    </div>
}
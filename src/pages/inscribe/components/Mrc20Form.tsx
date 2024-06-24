import { Button, Card, Checkbox, Col, Collapse, ConfigProvider, Descriptions, Form, Grid, Input, InputNumber, Radio, Row, Select, Spin, Tooltip, message } from "antd";
import { useCallback, useEffect, useState } from "react";
const { useBreakpoint } = Grid;
import { useModel, useSearchParams, history } from "umi";
import "./index.less";
import SeleceFeeRateItem from "./SeleceFeeRateItem";
import { broadcastBTCTx, broadcastTx, getMrc20AddressShovel, getMrc20AddressUtxo, getMrc20Info, getUserMrc20List, mintMrc20Commit, mintMrc20Pre, transferMrc20Commit, transfertMrc20Pre } from "@/services/api";
import { SIGHASH_ALL, getPkScriprt } from "@/utils/orders";
import { commitMintMRC20PSBT, transferMRC20PSBT } from "@/utils/mrc20";
import { Psbt, Transaction, networks, address as addressLib } from "bitcoinjs-lib";
import level from "@/assets/level.svg";
import { InscribeData } from "node_modules/@metaid/metaid/dist/core/entity/btc";
import { getCreatePinFeeByNet } from "@/config";
import { ArrowRightOutlined, DownOutlined, FileTextOutlined } from "@ant-design/icons";
import SuccessModal, { DefaultSuccessProps, SuccessProps } from "@/components/SuccessModal";
import btcIcon from "@/assets/logo_btc@2x.png";
import { formatSat } from "@/utils/utlis";
import PopLvl from "@/components/PopLvl";
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
export default ({ setTab }: { setTab: (tab: string) => void }) => {

    const [query] = useSearchParams();

    const { sm } = useBreakpoint();
    const [form] = Form.useForm();
    const _tab = query.get('tab');
    const _tickerId = query.get('tickerId');
    const [mintTokenID, setMintTokenID] = useState<string>('');
    const [mintInfoLoading, setMintInfoLoading] = useState(false);
    const [mintInfoStatus, setMintInfoStatus] = useState('');
    const [mintMrc20Info, setMintMrc20Info] = useState<API.MRC20TickInfo>();
    const [shovel, setShowel] = useState<API.MRC20Shovel[]>();
    const [list, setList] = useState<API.UserMrc20Asset[]>([])
    const [successProp, setSuccessProp] =
        useState<SuccessProps>(DefaultSuccessProps);
    const [submiting, setSubmiting] = useState(false);
    const { authParams, connected, connect, feeRates, network, disConnect, btcConnector, btcAddress } =
        useModel("wallet");
    const checkWallet = async () => {
        if (!btcConnector) return false;
        const address = await window.metaidwallet.btc.getAddress();
        if (address !== btcConnector.wallet.address) {
            disConnect();
            return false;
        }
        return true;
    };

    useEffect(() => {
        if (_tab === 'MRC-20') {
            setTab('MRC-20')
            if (_tickerId) {
                setMintTokenID(_tickerId)
                form.setFieldsValue({ type: 'mint', tickerId: _tickerId })
            }
        }

    }, [_tab, _tickerId])

    const handleMintTokenIDChange = (e) => {
        setMintTokenID(e.target.value);
    };

    const fetchMrc20Info = useCallback(async () => {
        if (!mintTokenID) return;
        setMintInfoLoading(true)
        setMintInfoStatus('validating')
        const { code, message, data } = await getMrc20Info(network, { tickId: mintTokenID });
        if (btcAddress) {
            const { data: ret, code } = await getMrc20AddressShovel(network, { tickId: mintTokenID, address: btcAddress, cursor: 0, size: 100 });
            if (code === 0 && ret && ret.list) {
                setShowel(ret.list.filter(item => {
                    if (data && data.qual && data.qual.path) {
                        if (item.path !== data.qual.path) return false
                    }
                    return item.popLv >= data.qual.lvl
                }))
            }
        }
        setMintInfoLoading(false)
        if (data && data.mrc20Id) {
            setMintMrc20Info(data);
            setMintInfoStatus('success')
            return
        }

        setMintInfoStatus('error')
        setMintMrc20Info(undefined)

    }, [mintTokenID, btcAddress, network])

    const fetchShovels = useCallback(async () => {

    }, [btcAddress, mintTokenID])

    const fetchList = useCallback(async () => {
        if (!btcAddress) return;
        const { data } = await getUserMrc20List(network, { address: btcAddress, cursor: 0, size: 50 });
        if (data && data.list) {
            setList(data.list);
        }

    }, [btcAddress, network])
    useEffect(() => {
        fetchList()
    }, [fetchList])

    useEffect(() => {
        fetchMrc20Info()
    }, [fetchMrc20Info])

    const deploy = async () => {
        if (!connected || !btcAddress || !btcConnector) return;
        await form.validateFields();
        const pass = await checkWallet();
        if (!pass) throw new Error("Account change");
        const { deployTicker, deployTokenName, deployMaxMintCount, deployAmountPerMint, deployDecimals, deployPremineCount, deployPath, deployDifficultyLevel, deployCount, feeRate } = form.getFieldsValue();
        const payload = {
            tick: deployTicker,
            tokenName: deployTokenName,
            decimals: String(deployDecimals),
            amtPerMint: String(deployAmountPerMint),
            mintCount: String(deployMaxMintCount),
            premineCount: String(deployPremineCount),
            qual: {
                path: deployPath,
                count: String(deployCount),
                lvl: String(deployDifficultyLevel)
            }

        }
        const metaidData: InscribeData = {
            operation: "create",
            body: JSON.stringify(payload),
            encryption: '0',
            version: '1.0.0',
            path: '/ft/mrc20/deploy',
            contentType: 'application/json',
            flag: network === "mainnet" ? "metaid" : "testid",
        };

        const ret = await window.metaidwallet.btc.deployMRC20({
            flag: network === "mainnet" ? "metaid" : "testid",
            commitFeeRate: Number(feeRate),
            revealFeeRate: Number(feeRate),
            body: {
                tick: deployTicker, // no less than 2-24 characters
                tokenName: deployTokenName, // token full name, 1-48 characters
                decimals: String(deployDecimals), // 0-12
                amtPerMint: String(deployAmountPerMint),
                mintCount: String(deployMaxMintCount),
                premineCount: String(deployPremineCount),
                blockheight: '',
                qual: {
                    path: deployPath,
                    count: String(deployCount),
                    lvl: String(deployDifficultyLevel)
                },
            }
        })
        console.log(ret, 'ret');
        // if (deployPremineCount) {
        //     const script = addressLib.toOutputScript(btcAddress, network === 'mainnet' ? networks.bitcoin : networks.testnet);
        //     const revealTx = Transaction.fromHex(ret.revealTx.rawTx);
        //     revealTx.addOutput(script, 546);
        //     console.log(revealTx, 'revealTx')
        // }
        const commitRes = await broadcastBTCTx(network, ret.commitTx.rawTx)
        const revealRes = await broadcastBTCTx(network, ret.revealTx.rawTx)

        console.log(commitRes, 'commitRes', revealRes, 'revealRes')





        // const ret = await btcConnector.inscribe({
        //     inscribeDataArray: [metaidData],
        //     options: {
        //         noBroadcast: "no",
        //         feeRate: Number(feeRate),
        //         service: getCreatePinFeeByNet(network),
        //     }
        // });
        // if (ret.status) throw new Error(ret.status);
        console.log(ret, 'ret');
        success('Deploy', { commitTxId: ret.commitTx.txId })
    }

    const success = (title: string, ret: any) => {
        setSuccessProp({
            show: true,
            onClose: () => {
                setSuccessProp(DefaultSuccessProps);
                form.resetFields();
            },
            onDown: () => {
                setSuccessProp(DefaultSuccessProps);
                form.resetFields();

            },
            title: title,
            tip: "Successful",
            children: (
                <div className="inscribeSuccess">
                    <div className="res">
                        {
                            ret.commitCost && <div className="item">
                                <div className="label">Transaction Cost</div>
                                <div className="value">
                                    <img src={btcIcon}></img> {formatSat(ret.commitCost)}
                                </div>
                            </div>
                        }

                        <div className="item">
                            <div className="label">Tarde Hash</div>
                            <div className="value">
                                <Tooltip title={ret.commitTxId}>
                                    <a
                                        style={{ color: "#fff", textDecoration: "underline" }}
                                        target="_blank"
                                        href={
                                            network === "testnet"
                                                ? `https://mempool.space/testnet/tx/${ret.commitTxId}`
                                                : `https://mempool.space/tx/${ret.commitTxId}`
                                        }
                                    >
                                        {ret.commitTxId.replace(/(\w{5})\w+(\w{5})/, "$1...$2")}
                                    </a>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        });
    }

    const mint = async () => {
        if (!connected || !btcAddress) return;
        await form.validateFields();
        const { type, feeRate, tickerId, pins, transferTickerId, amount, recipient } = form.getFieldsValue();
        // const tickerId = '8e659899275b1d06db870fbee9b293bc73d25e063cc86860a6d52c1e11091e9bi0'
        try {

            if (type === 'deploy') {
                await deploy();
            }
            if (type === 'mint') {
                if (!mintMrc20Info) return
                const mintPins = pins.map((pinId) => {
                    const pin = shovel?.find(item => item.id === pinId);
                    if (!pin) return;
                    return {
                        pinId: pin.id,
                        pinUtxoTxId: pin.location.split(":")[0],
                        pinUtxoIndex: Number(pin.location.split(":")[1]),
                        pinUtxoOutValue: pin.outputValue,
                        address: btcAddress,
                        pkScript: getPkScriprt(btcAddress, network).toString('hex'),
                    }
                })
                if (Number(mintMrc20Info.qual.count) && mintPins.length < Number(mintMrc20Info.qual.count)) {
                    throw new Error(`Select at Least ${mintMrc20Info.qual.count} PINs`)
                }
                const { code, message, data, } = await mintMrc20Pre(network, {
                    mintPins: mintPins, networkFeeRate: feeRate, outAddress: btcAddress, outValue: 546, tickerId,
                }, {
                    headers: {
                        ...authParams,
                    },
                });
                if (code !== 0) throw new Error(message);
                const { rawTx, revealPrePsbtRaw } = await commitMintMRC20PSBT(data, feeRate, btcAddress, network);
                const ret = await mintMrc20Commit(network, { orderId: data.orderId, commitTxRaw: rawTx, commitTxOutIndex: 0, revealPrePsbtRaw }, { headers: { ...authParams } })
                if (ret.code !== 0) throw new Error(ret.message);
                success('Mint', ret.data)
            }
            if (type === 'transfer') {
                // const amount = 200;
                // const recipient = 'mwKUTvJF43BqGqANeVdrtpRwd2zxNFvnWQ';
                const { data: utxoList } = await getMrc20AddressUtxo(network, { address: btcAddress, tickId: String(transferTickerId), cursor: 0, size: 100 }, {
                    headers: {
                        ...authParams,
                    },
                });
                if (utxoList.list.length === 0) throw new Error('No UTXO');
                const selectedUtxos = [];
                let totalAmount = 0;
                for (const utxo of utxoList.list) {
                    for (const tick of utxo.mrc20s) {
                        if (Number(tick.amount) > 0) {
                            totalAmount += Number(tick.amount)
                            selectedUtxos.push({
                                utxoIndex: utxo.outputIndex,
                                utxoTxId: utxo.txId,
                                utxoOutValue: utxo.satoshi,
                                tickerId: transferTickerId,
                                amount: tick.amount,
                                address: utxo.address,
                                pkScript: utxo.scriptPk
                            })
                        }
                        if (totalAmount > amount) {
                            break
                        }
                    }
                    if (totalAmount > amount) {
                        break
                    }
                }
                if (totalAmount < amount) {
                    throw new Error('Insufficient funds to reach the target amount')
                }

                const params: API.TransferMRC20PreReq = {
                    networkFeeRate: feeRate,
                    tickerId: transferTickerId,
                    changeAddress: btcAddress,
                    changeOutValue: 546,
                    transfers: selectedUtxos,
                    mrc20Outs: [{ amount: String(amount), address: recipient, outValue: 546, pkScript: getPkScriprt(recipient, network).toString('hex') }]
                }

                const { code, message, data } = await transfertMrc20Pre(network, params, {
                    headers: {
                        ...authParams,
                    },
                })
                if (code !== 0) throw new Error(message);

                const { rawTx, revealPrePsbtRaw } = await transferMRC20PSBT(data, feeRate, btcAddress, network);
                console.log(revealPrePsbtRaw, 'revealPrePsbtRaw', rawTx);
                const ret = await transferMrc20Commit(network, { orderId: data.orderId, commitTxRaw: rawTx, commitTxOutIndex: 0, revealPrePsbtRaw }, { headers: { ...authParams } });
                if (ret.code !== 0) throw new Error(ret.message);
                success('Transfer', ret.data)
            }
        } catch (e) {
            console.error(e);
            message.error(e.message)
        }


    }
    return <div className="mrc20Form">
        <Form
            {...formItemLayout}
            variant="filled"
            style={{ maxWidth: "96vw", width: 632 }}
            initialValues={{
                // type: 'transfer',
                // transferTickerId: '8e659899275b1d06db870fbee9b293bc73d25e063cc86860a6d52c1e11091e9bi0',
                // recipient: 'mwKUTvJF43BqGqANeVdrtpRwd2zxNFvnWQ',
                // amount: 200
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
                        if (type === 'deploy') {
                            return <>
                                <Form.Item label="Ticker" name="deployTicker"
                                    rules={[{ required: true }]}
                                >
                                    <Input
                                        size="large"

                                    />
                                </Form.Item>
                                <Form.Item label="Token Name" name="deployTokenName"

                                >
                                    <Input
                                        size="large"

                                    />
                                </Form.Item>

                                <Form.Item rules={[{ required: true }]} label="Max mint Count" name="deployMaxMintCount"

                                >
                                    <Input
                                        size="large"

                                    />
                                </Form.Item>
                                <Form.Item rules={[{ required: true }]} label="Amount per Mint" name="deployAmountPerMint"

                                >
                                    <Input
                                        size="large"

                                    />
                                </Form.Item>

                                <Collapse className="collapse" style={{ padding: 0 }} ghost items={[
                                    {
                                        key: '1',
                                        label: <Row gutter={[0, 0]}> <Col offset={sm ? 4 : 0} span={sm ? 20 : 24}><div className="collapsePanel"> more options<div
                                            className="collapseIcon"
                                        >
                                            <DownOutlined /></div>
                                        </div></Col></Row>,

                                        showArrow: false,
                                        children: <> <Form.Item rules={[{ required: true }]} label="Decimals" name="deployDecimals"

                                        >
                                            <InputNumber
                                                size="large"
                                                style={{ width: '100%' }}
                                                min={0}
                                                max={12}

                                            />
                                        </Form.Item>

                                            <Form.Item rules={[{ required: true }]} label="Premine Count" name="deployPremineCount"

                                            >
                                                <InputNumber
                                                    size="large"
                                                    style={{ width: '100%' }}
                                                />
                                            </Form.Item>

                                            <Form.Item rules={[{ required: true }]} label="Path" name="deployPath"

                                            >
                                                <Input
                                                    size="large"
                                                    style={{ width: '100%' }}
                                                />
                                            </Form.Item>
                                            <Form.Item rules={[{ required: true }]} label="Difficulty level" name="deployDifficultyLevel"

                                            >
                                                <Select style={{ textAlign: 'left' }} size="large" options={new Array(14).fill(null).map((_, i) => {
                                                    return { label: `Lv${i}`, value: i }
                                                })}>

                                                </Select>
                                            </Form.Item>

                                            <Form.Item rules={[{ required: true }]} label="Count" name="deployCount"

                                            >
                                                <InputNumber
                                                    size="large"
                                                    style={{ width: '100%' }}
                                                />
                                            </Form.Item></>
                                    }
                                ]}>

                                </Collapse>




                            </>
                        }
                        if (type === 'transfer') {
                            return <>
                                <Form.Item label="Token ID" name="transferTickerId"
                                    rules={[{ required: true }]}
                                >
                                    <Select

                                        showSearch

                                        style={{ textAlign: 'left' }} size="large"
                                        placeholder="Select a token"
                                        options={list.map(item => {
                                            return { label: <div><span style={{ color: 'var(--primary)' }}>{item.balance}</span> {item.tick}</div>, value: item.mrc20Id }
                                        })}
                                    >

                                    </Select>
                                </Form.Item>
                                <Form.Item label="Amount" name="amount" rules={[{ required: true }]}>
                                    <InputNumber
                                        size="large"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                                <Form.Item label="Recipient address" name="recipient" rules={[{ required: true }]}>
                                    <Input
                                        size="large"
                                    />
                                </Form.Item></>
                        }
                        if (type === 'mint') {
                            return <>

                                <Form.Item label="Token ID" name="tickerId" rules={[{ required: true }]} validateStatus={mintInfoStatus}
                                    help={mintInfoStatus === 'error' ? <div style={{ textAlign: 'left' }}>This token ID does not correspond to any MRC 20; Please re-enter.</div> : <></>} >
                                    <Input
                                        size="large"
                                        onBlur={handleMintTokenIDChange}
                                    />
                                </Form.Item>
                                <Row gutter={[0, 0]}>
                                    <Col offset={sm ? 5 : 0} span={sm ? 19 : 24}> <Spin spinning={mintInfoLoading}>

                                        {
                                            mintMrc20Info && <> <div style={{ color: 'var(--primary)', marginBottom: 20 }}>Detail</div><Card bordered={false} style={{ marginBottom: 20 }} >
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
                                                        },
                                                        {
                                                            key: 'Path',
                                                            label: 'Path',
                                                            children: <Tooltip title={mintMrc20Info.qual.path}>{mintMrc20Info.qual.path.replace(/(.{6}).+(.{5})/, "$1...$2")}</Tooltip>
                                                        },
                                                        {
                                                            key: 'Difficultylevel',
                                                            label: 'Difficulty level',
                                                            children: <>{mintMrc20Info.qual.lvl || '--'}</>
                                                        },
                                                        {
                                                            key: 'Count',
                                                            label: 'Count',
                                                            children: <>{mintMrc20Info.qual.count || '--'}</>
                                                        }
                                                    ]}></Descriptions>
                                            </Card></>
                                        }
                                    </Spin>
                                    </Col>
                                </Row>
                                {mintMrc20Info && <>
                                    {(shovel && shovel.length > 0) ?
                                        <Row gutter={[0, 0]}>
                                            <Col offset={sm ? 5 : 0} span={sm ? 19 : 24}>
                                                <Form.Item label={<div>PINs {mintMrc20Info.qual.count && `(Select at Least ${mintMrc20Info.qual.count} PINs)`}</div>} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} name="pins" rules={[{ required: true }]}

                                                >
                                                    <Checkbox.Group>
                                                        <Row>
                                                            {shovel?.map(item => {
                                                                return <Col span={24} key={item.id}><Checkbox className="customCheckbox" value={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row-reverse' }}>
                                                                    <div className="value">#{item.number} <a href={`https://man${network === 'mainnet' ? '' : '-test'}.metaid.io/pin/${item.id}`} target='_blank'>  <ArrowRightOutlined style={{ color: 'rgba(255, 255, 255, 0.5)', transform: 'rotate(-0.125turn)' }} /></a> </div></Checkbox></Col>
                                                            })}

                                                        </Row></Checkbox.Group>
                                                </Form.Item></Col></Row> : <Row gutter={[0, 0]}>
                                            <Col offset={sm ? 5 : 0} span={sm ? 19 : 24}><div className="noPins" onClick={() => { setTab('PINs') }}><FileTextOutlined style={{ fontSize: 36 }} /><div>
                                                No PIN. GO get it
                                            </div></div></Col></Row>
                                    }
                                </>}

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
            <Col offset={sm ? 5 : 0} span={sm ? 19 : 24}>
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

        <SuccessModal {...successProp}></SuccessModal>
    </div>

} 
import { Button, Card, Checkbox, Col, Modal, Collapse, ConfigProvider, Descriptions, Form, Grid, Input, InputNumber, Popover, Radio, Row, Select, Spin, Tooltip, Typography, message } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
const { useBreakpoint } = Grid;
import { useModel, useSearchParams, history } from "umi";
import "./index.less";
import { broadcastBTCTx, broadcastTx, deployCommit, getIdCoinInfo, getIdCoinMintOrder, getMrc20AddressShovel, getMrc20AddressUtxo, getMrc20Info, getUserMrc20List, mintIdCoinCommit, mintIdCoinPre, mintMrc20Commit, mintMrc20Pre, transferMrc20Commit, transfertMrc20Pre } from "@/services/api";
import { SIGHASH_ALL, getPkScriprt } from "@/utils/orders";
import { commitMintMRC20PSBT, transferMRC20PSBT } from "@/utils/mrc20";
import { Psbt, Transaction, networks, address as addressLib } from "bitcoinjs-lib";
import level from "@/assets/level.svg";
import { InscribeData } from "node_modules/@metaid/metaid/dist/core/entity/btc";
import { getCreatePinFeeByNet } from "@/config";
import { ArrowRightOutlined, DownOutlined, FileTextOutlined, InfoCircleOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import SuccessModal, { DefaultSuccessProps, SuccessProps } from "@/components/SuccessModal";
import btcIcon from "@/assets/logo_btc@2x.png";
import { formatSat } from "@/utils/utlis";
import PopLvl from "@/components/PopLvl";
import DeployComfirm, { DeployComfirmProps, defaultDeployComfirmProps } from "./DeployComfirm";
import MRC20DetailCard from "./MRC20DetailCard";
import NumberFormat from "@/components/NumberFormat";
import MRC20Icon from "@/components/MRC20Icon";
import { addUtxoSafe, getUtxos } from "@/utils/psbtBuild";
import SelectPins from "./SelectPins";
import { buildMintIdCointPsbt } from "@/utils/idcoin";
import IdCoinCard from "./IdCoinCard";
import ComfirmMintIdCoin from "./ComfirmMintIdCoin";
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

export interface MRC20TransferParams {
    body: string
    mrc20TickId: string
    flag?: 'metaid' | 'testid'
    revealAddr?: string
    commitFeeRate: number
    revealFeeRate: number
    changeAddress?: string
    revealOutValue?: number
    service?: {
        address: string
        satoshis: string
    }
}
export default ({ setTab }: { setTab: (tab: string) => void }) => {
    const [query] = useSearchParams();

    const { sm } = useBreakpoint();
    const [form] = Form.useForm();
    const type = Form.useWatch('type', form);
    const _deployMaxMintCount = Form.useWatch('deployMaxMintCount', form);
    const _deployAmountPerMint = Form.useWatch('deployAmountPerMint', form);
    const _deployIcon = Form.useWatch('deployIcon', form);
    const _deployPremineCount = Form.useWatch('deployPremineCount', form);
    // transferTickerId
    const _transferTickerId = Form.useWatch('transferTickerId', form);
    const totalSupply = useMemo(() => {
        if (_deployMaxMintCount && _deployAmountPerMint) {
            return BigInt(Math.round(_deployMaxMintCount)) * BigInt(Math.round(_deployAmountPerMint))
        } else {
            return BigInt(0)
        }
    }, [_deployMaxMintCount, _deployAmountPerMint])
    const totalPreMint = useMemo(() => {
        if (_deployPremineCount && _deployAmountPerMint) {
            return BigInt(Math.round(_deployPremineCount)) * BigInt(Math.round(_deployAmountPerMint))
        } else {
            return BigInt(0)
        }
    }, [_deployPremineCount, _deployAmountPerMint])
    const _tab = query.get('tab');
    const _tickerId = query.get('tickerId');
    const [mintTokenID, setMintTokenID] = useState<string>('');
    const [mintInfoLoading, setMintInfoLoading] = useState(false);
    const [mintInfoStatus, setMintInfoStatus] = useState('');
    const [mintMrc20Info, setMintMrc20Info] = useState<API.MRC20TickInfo>();
    const [IdCoinInfo, setIdCoinInfo] = useState<API.IdCoin>();
    const [shovel, setShowel] = useState<API.MRC20Shovel[]>();
    const [list, setList] = useState<API.UserMrc20Asset[]>([]);

    // mint Idcoin 
    const [comfirmVisible, setComfirmVisible] = useState(false)
    const [mintIdCoinOrder, setMintIdCoinOrder] = useState<API.MintIdCoinPreRes>();
    const [addressMintState, setAddressMintState] = useState<number>(0)

    const [successProp, setSuccessProp] =
        useState<SuccessProps>(DefaultSuccessProps);
    const [deployComfirmProps, setDeployComfirmProps] = useState<DeployComfirmProps>(defaultDeployComfirmProps)
    const [submiting, setSubmiting] = useState(false);
    const { authParams, connected, connect, feeRate, network, disConnect, btcConnector, btcAddress } =
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

    // precision
    const transferPrecision = useMemo(() => {
        if (_transferTickerId && list.length > 0) {
            const token = list.find(item => item.mrc20Id === _transferTickerId)
            if (token) {
                return Number(token.decimals)
            }
        }
        return 0
    }, [_transferTickerId, list])



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
        let didCancel = false;
        const fetchMrc20Info = async () => {
            if (!mintTokenID) return;
            setShowel([])
            setIdCoinInfo(undefined)
            setMintInfoLoading(true)
            setMintInfoStatus('validating')
            const params = {};
            if (mintTokenID.length > 24) {
                params.tickId = mintTokenID
            } else {
                params.tick = mintTokenID.toUpperCase()
            }
            const { code, message, data } = await getMrc20Info(network, params);
            let _shovels: API.MRC20Shovel[] = [];
            let _idCoin: API.IdCoin | undefined = undefined;
            let _addressMintState = 0;
            if (data && data.mrc20Id) {
                const idCoinRet = await getIdCoinInfo(network, { tickId: data.mrc20Id });
                if (idCoinRet.code === 0 && idCoinRet.data) {
                    _idCoin = idCoinRet.data;
                    if (btcAddress && authParams) {
                        const mintOrder = await getIdCoinMintOrder(network, { tickId: data.mrc20Id, address: btcAddress }, { headers: { ...authParams } });
                        console.log(mintOrder, mintOrder.data, 'mintOrder')
                        if (mintOrder.code === 0 && mintOrder.data && mintOrder.data.addressMintState === 1) {
                            _addressMintState = 1
                        }
                    }
                }
            }
            if (!_idCoin || _addressMintState === 1) {
                if (btcAddress && data && data.pinCheck && data.pinCheck.count) {
                    const { data: ret, code } = await getMrc20AddressShovel(network, { tickId: data.mrc20Id, address: btcAddress, cursor: 0, size: 100 });
                    if (code === 0 && ret && ret.list) {
                        _shovels = ret.list
                    }
                }
            }

            if (didCancel) return;
            setMintInfoLoading(false)
            setShowel(_shovels)
            setIdCoinInfo(_idCoin)
            setAddressMintState(_addressMintState)
            if (data && data.mrc20Id) {
                setMintMrc20Info(data);
                setMintInfoStatus('success')
                _shovels.length > 0 && form.setFieldsValue({ pins: _shovels.slice(0, Number(data.pinCheck.count)).map(item => item.id) })
                return
            }

            setMintInfoStatus('error')
            setMintMrc20Info(undefined)
        }
        fetchMrc20Info()
        return () => {
            didCancel = true
        }
    }, [mintTokenID, btcAddress, network, authParams])


    const deploy = async () => {
        if (!connected || !btcAddress || !btcConnector) return;

        const pass = await checkWallet();
        if (!pass) throw new Error("Account change");
        const { deployTicker, deployTokenName, deployIcon, deployMaxMintCount, deployAmountPerMint, deployDecimals = '8', deployPremineCount = '', deployPath = '', deployDifficultyLevel = '', deployCount = '', deployPayTo = '', deployPayAmount = '' } = form.getFieldsValue();

        const payload: any = {
            tick: deployTicker,
            tokenName: deployTokenName,
            decimals: String(deployDecimals),
            amtPerMint: String(deployAmountPerMint),
            mintCount: String(deployMaxMintCount),
            premineCount: String(deployPremineCount),
            blockheight: '',
            pinCheck: {
                path: deployPath,
                count: String(deployCount),
                lvl: String(deployDifficultyLevel)
            },
            payCheck: {
                payTo: deployPayTo,
                payAmount: deployPayAmount
            }
        }
        if ((Number(payload.decimals) + (BigInt(payload.amtPerMint) * BigInt(payload.mintCount)).toString().length) > 20) {
            throw new Error('The decimals, Amount Per Mint, and Max Mint Count values must not exceed 20 digits')
        }

        if (deployIcon) {
            payload.metadata = JSON.stringify({ icon: deployIcon })
        }
        const ret = await window.metaidwallet.btc.deployMRC20({
            flag: network === "mainnet" ? "metaid" : "testid",
            commitFeeRate: Number(feeRate),
            revealFeeRate: Number(feeRate),
            body: payload,
            options: {
                markSafe: true,
                noBroadcast: false
            }
        }).catch(err => {
            console.log(err, 'errrrr')
            throw new Error(err)
        })
        console.log(ret)
        if (ret.status) throw new Error(ret.status)
        const commitRes = await deployCommit(network, { commitTxRaw: ret.commitTx.rawTx, revealTxRaw: ret.revealTx.rawTx }, {
            headers: {
                ...authParams,
            },
        })
        await addUtxoSafe(btcAddress, [{ txId: ret.commitTx.txId, vout: 1 }])
        if (commitRes.code !== 0) throw new Error(commitRes.message)
        setDeployComfirmProps(defaultDeployComfirmProps)
        setSuccessProp({
            show: true,
            onClose: () => {
                setSuccessProp(DefaultSuccessProps);
                form.resetFields();
                form.setFieldValue('type', 'deploy')
            },
            onDown: () => {
                setSuccessProp(DefaultSuccessProps);
                form.resetFields();
                history.push('/mrc20History')

            },
            title: "Deploy",
            tip: "Successful",
            okText: 'OK',
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
                                        <Typography.Text copyable={{ text: ret.revealTxId }}>
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
    }
    const mintIdCoin = async () => {
        if (!connected || !btcAddress || !btcConnector || !mintIdCoinOrder) return;

        const pass = await checkWallet();
        if (!pass) throw new Error("Account change");
        if (!IdCoinInfo) return;
        const { rawTx } = await buildMintIdCointPsbt(
            mintIdCoinOrder,
            feeRate,
            btcAddress,
            network
        )
        const commitRes = await mintIdCoinCommit(network, {
            orderId: mintIdCoinOrder.orderId,
            commitTxOutInscribeIndex: 0,
            commitTxOutMintIndex: 1,
            commitTxRaw: rawTx,
        }, { headers: authParams })
        console.log(commitRes)
        if (commitRes.code !== 0) throw new Error(commitRes.message)
        await addUtxoSafe(btcAddress, [{ txId: commitRes.data.commitTxId, vout: 2 }])
        setMintIdCoinOrder(undefined)
        setComfirmVisible(false)
        setSuccessProp({
            show: true,
            onClose: () => {
                setSuccessProp(DefaultSuccessProps);
                form.resetFields();
                form.setFieldValue('type', 'mint')
            },
            onDown: () => {
                setSuccessProp(DefaultSuccessProps);
                form.resetFields();
                history.push('/mrc20History?tab=ID-Coins Mint')

            },
            title: "Mint",
            tip: "Successful",
            okText: 'OK',
            children: (
                <div className="inscribeSuccess">
                    <div className="res">
                        <div className="item">
                            <div className="label">TxId </div>
                            <div className="value">
                                <Tooltip title={commitRes.data.revealMintTxId}>
                                    <a
                                        style={{ color: "#fff", textDecoration: "underline" }}
                                        target="_blank"
                                        href={
                                            network === "testnet"
                                                ? `https://mempool.space/testnet/tx/${commitRes.data.revealMintTxId}`
                                                : `https://mempool.space/tx/${commitRes.data.revealMintTxId}`
                                        }
                                    >
                                        <Typography.Text copyable={{ text: commitRes.data.revealMintTxId }}>
                                            {commitRes.data.revealMintTxId.replace(/(\w{5})\w+(\w{5})/, "$1...$2")}
                                        </Typography.Text>
                                    </a>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                    <div className="tips">
                        <InfoCircleOutlined />
                        <span>Current minting transaction status is Pending. Please wait for the minting transaction to be confirmed before transferring or trading this token.</span>
                    </div>
                </div>
            ),
        });


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
                form.setFieldValue('type', 'transfer')

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
                            <div className="label">TxId </div>
                            <div className="value">
                                <Tooltip title={ret.revealTxId}>
                                    <a
                                        style={{ color: "#fff", textDecoration: "underline" }}
                                        target="_blank"
                                        href={
                                            network === "testnet"
                                                ? `https://mempool.space/testnet/tx/${ret.revealTxId}`
                                                : `https://mempool.space/tx/${ret.revealTxId}`
                                        }
                                    >
                                        <Typography.Text copyable={{ text: ret.revealTxId }}>{ret.revealTxId.replace(/(\w{5})\w+(\w{5})/, "$1...$2")}</Typography.Text>
                                    </a>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        });
    }

    const beforeSubmit = async () => {
        if (!connected || !btcAddress) return;
        await form.validateFields();
        const { type } = form.getFieldsValue();
        try {


            if (type === 'deploy') {
                const { deployTicker, deployTokenName, deployIcon, deployMaxMintCount, deployAmountPerMint, deployDecimals = '8', deployPremineCount = '', deployPath = '', deployDifficultyLevel = '', deployCount = '' } = form.getFieldsValue();

                const payload: any = {
                    tick: deployTicker,
                    tokenName: deployTokenName,
                    decimals: String(deployDecimals),
                    amtPerMint: String(deployAmountPerMint),
                    mintCount: String(deployMaxMintCount),
                    premineCount: String(deployPremineCount),
                    blockheight: '',
                    pinCheck: {
                        path: deployPath,
                        count: String(deployCount),
                        lvl: String(deployDifficultyLevel)
                    },
                }
                if ((Number(payload.decimals) + (BigInt(payload.amtPerMint) * BigInt(payload.mintCount)).toString().length) > 20) {
                    message.error('The decimals, Amount Per Mint, and Max Mint Count values must not exceed 20 digits')
                    return
                }

                if (deployIcon) {
                    payload.metadata = JSON.stringify({ icon: deployIcon })
                }
                setDeployComfirmProps({
                    show: true,
                    onClose: () => {
                        setDeployComfirmProps(defaultDeployComfirmProps)
                    },
                    onConfirm: submit,
                    submiting: submiting,
                    deployInfo: payload
                })
            } else {
                if (type === 'mint' && IdCoinInfo && addressMintState === 0) {
                    if (!connected || !btcAddress || !btcConnector) return;
                    const pass = await checkWallet();
                    if (!pass) throw new Error("Account change");
                    if (!IdCoinInfo) return;

                    const prePayload = {
                        networkFeeRate: feeRate,
                        tickId: IdCoinInfo.mrc20Id,
                        outAddress: btcAddress,
                        outValue: 546,
                    }
                    const { code, message, data } = await mintIdCoinPre(network, prePayload, { headers: { ...authParams } })
                    if (code !== 0) throw new Error(message);
                    setMintIdCoinOrder(data)
                    setComfirmVisible(true)

                } else {
                    await submit()
                }

            }
        } catch (err) {
            message.error(err.message)
        }
    }

    const submit = async () => {
        if (!connected || !btcAddress) return;
        await form.validateFields();
        setSubmiting(true);
        const { type, pins = [], transferTickerId, amount, recipient } = form.getFieldsValue();
        try {

            if (type === 'deploy') {
                await deploy();

            }
            if (type === 'mint') {
                if (IdCoinInfo && addressMintState === 0) {
                    await mintIdCoin()

                } else {
                    if (!mintMrc20Info) return;
                    if (Number(mintMrc20Info.pinCheck.count) && pins.length < Number(mintMrc20Info.pinCheck.count)) {
                        throw new Error(`Select  ${mintMrc20Info.pinCheck.count} PINs`)
                    }
                    console.log(pins, 'pins')
                    const mintPins = pins.map((pinId: string) => {
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

                    const { code, message, data, } = await mintMrc20Pre(network, {
                        mintPins: mintPins, networkFeeRate: feeRate, outAddress: btcAddress, outValue: 546, tickerId: mintMrc20Info.mrc20Id,
                    }, {
                        headers: {
                            ...authParams,
                        },
                    });
                    if (code !== 0) throw new Error(message);

                    const { rawTx, revealPrePsbtRaw } = await commitMintMRC20PSBT(data, feeRate, btcAddress, network);
                    const ret = await mintMrc20Commit(network, { orderId: data.orderId, commitTxRaw: rawTx, commitTxOutIndex: 0, revealPrePsbtRaw }, { headers: { ...authParams } })
                    if (ret.code !== 0) throw new Error(ret.message);
                    await addUtxoSafe(btcAddress, [{ txId: ret.data.commitTxId, vout: 1 }])
                    setSuccessProp({
                        show: true,
                        onClose: () => {
                            setSuccessProp(DefaultSuccessProps);
                            form.resetFields();
                            form.setFieldValue('type', 'mint')
                        },
                        onDown: () => {
                            setSuccessProp(DefaultSuccessProps);
                            form.resetFields();
                            history.push('/mrc20History?tab=Mint')

                        },
                        title: "Mint",
                        tip: "Successful",
                        okText: 'OK',
                        children: (
                            <div className="inscribeSuccess">
                                <div className="res">
                                    {/* {
                                        ret.data.commitCost && <div className="item">
                                            <div className="label">Transaction Cost</div>
                                            <div className="value">
                                                <img src={btcIcon}></img> {formatSat(ret.commitCost)}
                                            </div>
                                        </div>
                                    } */}

                                    <div className="item">
                                        <div className="label">TxId </div>
                                        <div className="value">
                                            <Tooltip title={ret.data.revealTxId}>
                                                <a
                                                    style={{ color: "#fff", textDecoration: "underline" }}
                                                    target="_blank"
                                                    href={
                                                        network === "testnet"
                                                            ? `https://mempool.space/testnet/tx/${ret.data.revealTxId}`
                                                            : `https://mempool.space/tx/${ret.data.revealTxId}`
                                                    }
                                                >
                                                    <Typography.Text copyable={{ text: ret.data.revealTxId }}>
                                                        {ret.data.revealTxId.replace(/(\w{5})\w+(\w{5})/, "$1...$2")}
                                                    </Typography.Text>
                                                </a>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                                <div className="tips">
                                    <InfoCircleOutlined />
                                    <span>Current minting transaction status is Pending. Please wait for the minting transaction to be confirmed before transferring or trading this token.</span>
                                </div>
                            </div>
                        ),
                    });
                }

            }
            if (type === 'transfer') {
                const { data: utxoList } = await getMrc20AddressUtxo(network, { address: btcAddress, tickId: String(transferTickerId), cursor: 0, size: 100 }, {
                    headers: {
                        ...authParams,
                    },
                });
                if (utxoList.list.length === 0) throw new Error('No UTXO');
                const selectedUtxos = [];
                let totalAmount = 0;
                console.log(utxoList, 'getMrc20AddressUtxo')
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
                    throw new Error('No available UTXOs. Please wait for existing transactions to be confirmed. ')
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
                await addUtxoSafe(btcAddress, [{ txId: ret.data.commitTxId, vout: 1 }])
                await fetchList()
                success('Transfer', ret.data)
            }
        } catch (e: any) {
            console.error(e);
            if (e.message === 'Insufficient funds to reach the target amount') {
                message.error('No available UTXOs. Please wait for existing transactions to be confirmed.');

            } else {
                message.error(e.message)
            }


        }
        setSubmiting(false);


    }
    // const [validateTickerStatus,setValidateTickerStatus] = useState<string>()
    // const validateTicker = async (tick: string) => {
    //     setValidateTickerStatus('validating')
    //     const { data } = await getMrc20Info(network, { tick: tick });
    //     if(data && data.mrc20Id){
    //         setValidateTickerStatus('error')
    //     } 
    // }
    return <div className="mrc20Form">
        <ConfigProvider
            theme={{
                components: {
                    "Input": {

                        "colorSplit": "rgba(253, 253, 253, 0)"
                    },
                    "InputNumber": {
                        "colorSplit": "rgba(253, 253, 253, 0)"
                    }
                },
            }}>
            <Form
                {...formItemLayout}
                variant="filled"
                style={{ maxWidth: "96vw", width: 632 }}
                initialValues={{
                    type: 'deploy',
                    // transferTickerId: '8e659899275b1d06db870fbee9b293bc73d25e063cc86860a6d52c1e11091e9bi0',
                    // recipient: 'mwKUTvJF43BqGqANeVdrtpRwd2zxNFvnWQ',
                    // amount: 200
                    deployPremineCount: 0,
                    deployMaxMintCount: 21000,
                    deployDecimals: 8,
                    deployAmountPerMint: 1000,
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
                                        rules={[{ required: true }, { type: 'string', min: 2, max: 24 }, { pattern: new RegExp(/^[a-zA-Z0-9\-]*$/), message: "No Space or Special Characters Allowed" }, () => ({
                                            async validator(_, value) {
                                                if (!value || value.length < 2) {
                                                    return Promise.resolve();
                                                }
                                                const { data } = await getMrc20Info(network, { tick: value.toUpperCase() });
                                                if (data && data.mrc20Id) {
                                                    return Promise.reject(new Error('This tick already exists.'));
                                                }

                                            },
                                        })]}
                                        validateTrigger="onBlur"
                                    >
                                        <Input
                                            size="large"
                                            maxLength={24}
                                            placeholder="2~24 charaters"
                                        />
                                    </Form.Item>




                                    <Form.Item rules={[{ required: true }, { max: 1000000000000, min: 1, type: 'number', message: 'Total number of minting transactions allowed. Min: 1, Max: 1,000,000,000,000 （1e12).' }]} label="Max Mint Count" name="deployMaxMintCount"

                                    >
                                        <InputNumber
                                            size="large"
                                            style={{ width: '100%' }}
                                            // min={1}

                                            precision={0}
                                            addonAfter={
                                                <Tooltip title="Total number of minting transactions allowed. Min: 1, Max: 1,000,000,000,000 （1e12).">
                                                    <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                                </Tooltip>}
                                        />
                                    </Form.Item>
                                    <Form.Item rules={[{ required: true }, { max: 1000000000000, min: 1, type: 'number', message: 'Amount of tokens minted per transaction. Min: 1, Max: 1,000,000,000,000 （1e12).' }]} label="Amount Per Mint" name="deployAmountPerMint"
                                    // help={<div style={{ textAlign: 'left',color:'rgba(255, 255, 255, 0.6)',fontSize:14 }}> TotalSupply: </div>}
                                    >
                                        <InputNumber
                                            size="large"
                                            style={{ width: '100%' }}
                                            // min={1}
                                            // max={1000000000000}
                                            precision={0}
                                            addonAfter={
                                                <Tooltip title="Amount of tokens minted per transaction. Min: 1, Max: 1,000,000,000,000 （1e12).">
                                                    <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                                </Tooltip>
                                            }
                                        />
                                    </Form.Item>
                                    <Row gutter={[0, 0]}>
                                        <Col offset={sm ? 5 : 0} span={sm ? 19 : 24} style={{ textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
                                            Total Supply: <NumberFormat value={totalSupply} isBig decimal={0} />
                                        </Col>
                                    </Row>

                                    <Collapse className="collapse" style={{ padding: 0 }} ghost items={[
                                        {
                                            key: '1',
                                            label: <Row gutter={[0, 0]}> <Col offset={sm ? 4 : 0} span={sm ? 20 : 24}><div className="collapsePanel"> more options<div
                                                className="collapseIcon"
                                            >
                                                <DownOutlined /></div>
                                            </div></Col></Row>,

                                            showArrow: false,
                                            children: <>
                                                <Form.Item label="Token Name" name="deployTokenName"
                                                    rules={[{ type: 'string', min: 1, max: 48 }]}
                                                >
                                                    <Input
                                                        size="large"
                                                        maxLength={48}
                                                        placeholder="less than 48 charaters"
                                                        addonAfter={
                                                            <Tooltip title="Full name of the token. Length: 1-48 characters.">
                                                                <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                                            </Tooltip>
                                                        }
                                                    />
                                                </Form.Item>
                                                <Form.Item label="Icon" name="deployIcon"

                                                >
                                                    <Input
                                                        size="large"
                                                        addonAfter={
                                                            <Tooltip title="Optional. Format: 'metafile://pinid'. You should inscribe your icon file first, then paste the metafile protocol URI here.">
                                                                <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                                            </Tooltip>
                                                        }
                                                        suffix={_deployIcon ? <img src={_deployIcon.replace('metafile://', `https://man${network === 'testnet' && '-test'}.metaid.io/content/`)} style={{ width: 24, height: 24, borderRadius: '50%' }} /> : <></>}
                                                        placeholder="metafile://Your-Icon-Pinid"
                                                    />
                                                </Form.Item>
                                                <ConfigProvider
                                                    theme={{
                                                        components: {
                                                            "Input": {

                                                                "colorSplit": "rgba(253, 253, 253, 0)"
                                                            }
                                                        },
                                                    }}>
                                                    <Form.Item label="Decimals" name="deployDecimals"
                                                        rules={[{ max: 12, min: 0, type: 'number', message: 'Decimal Places: Min 0, Max 12. Default is 8.' }]}
                                                    >
                                                        <InputNumber
                                                            size="large"
                                                            style={{ width: '100%' }}
                                                            // min={0}
                                                            // max={12}
                                                            precision={0}
                                                            addonAfter={
                                                                <Tooltip title="Decimal Places: Min 0, Max 12. Default is 8.">
                                                                    <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                                                </Tooltip>
                                                            }

                                                        />
                                                    </Form.Item>
                                                </ConfigProvider>

                                                <Form.Item rules={[({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        if (!value || getFieldValue('deployMaxMintCount') >= value) {
                                                            return Promise.resolve();
                                                        }
                                                        return Promise.reject(new Error('Premine Count cannot be greater than Max Mint Count !'));
                                                    },
                                                })]} label="Premine Count" name="deployPremineCount"

                                                >
                                                    <InputNumber
                                                        size="large"
                                                        style={{ width: '100%' }}
                                                        min={0}

                                                        precision={0}
                                                        addonAfter={
                                                            <Tooltip title="Pre-Minted Count. Value must be ≥ 0 and ≤ Max Mint Count. If this Token is a fair launch, please enter 0.">
                                                                <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                                            </Tooltip>
                                                        }
                                                    />
                                                </Form.Item>
                                                <Form.Item label="Pay To" name="deployPayTo"
                                                    rules={[]}
                                                >
                                                    <Input
                                                        size="large"
                                                        maxLength={48}
                                                        placeholder=""
                                                        addonAfter={
                                                            <Tooltip title="">
                                                                <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                                            </Tooltip>
                                                        }
                                                    />
                                                </Form.Item>
                                                <Form.Item label="Pay Amount" name="deployPayAmount"
                                                    rules={[]}
                                                >
                                                    <Input
                                                        size="large"
                                                        maxLength={48}
                                                        placeholder=""
                                                        addonAfter={
                                                            <Tooltip title="">
                                                                <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                                            </Tooltip>
                                                        }
                                                    />
                                                </Form.Item>
                                                {
                                                    _deployPremineCount > 0 && <Row gutter={[0, 0]} style={{ marginBottom: 20 }}>
                                                        <Col offset={sm ? 5 : 0} span={sm ? 19 : 24} style={{ textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
                                                            Total Pre-Minted Token Amount: : <NumberFormat value={totalPreMint} isBig decimal={0} /><br />
                                                            These tokens will be in your wallet once deployment is confirmed.
                                                        </Col>
                                                    </Row>
                                                }

                                                <Row gutter={[0, 0]}>
                                                    <Col offset={sm ? 4 : 0} span={sm ? 20 : 24} style={{ marginBottom: 20 }}>
                                                        <Popover title='PoP Difficulty Settings' content={<Typography style={{ maxWidth: '400px' }}>
                                                            <Typography.Paragraph>
                                                                MRC-20 has a unique and innovative difficulty setting called PoP (Proof of PIN). Users can generate and obtain an NFT called a PIN by generating MetaID interaction transactions. Each PIN has corresponding attributes, including rarity, path, etc. The deployer can decide that during the MRC-20 minting process, users need to provide corresponding PIN proofs to obtain minting eligibility.
                                                            </Typography.Paragraph>
                                                            <Typography.Paragraph>

                                                                The difficulty setting has four parameters:

                                                            </Typography.Paragraph>
                                                            <ul>
                                                                <li>
                                                                    <Typography.Text code strong>
                                                                        difficulty level
                                                                    </Typography.Text>: The difficulty level determines that a PIN of the corresponding or higher difficulty level is required to be eligible to mint MRC-20.
                                                                </li>
                                                                <li>
                                                                    <Typography.Text code strong>path</Typography.Text>
                                                                    : determines that a PIN with the corresponding path is required to be eligible to mint MRC-20.
                                                                </li>
                                                                <li>
                                                                    <Typography.Text code strong>count</Typography.Text>
                                                                    : one needs to provide the corresponding number of PINs that meet the difficulty criteria to be eligible to mint MRC-20.
                                                                </li>
                                                                <li>
                                                                    <Typography.Text code strong>creator</Typography.Text>
                                                                    :one needs to provide PINs of certain creators to be eligible to mint MRC-20.
                                                                </li>
                                                            </ul>
                                                        </Typography>}>
                                                            PoP Difficulty Settings <QuestionCircleOutlined /><br />
                                                            <span style={{ textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>(Leave them blank if you are not sure what they are. )</span>
                                                        </Popover>
                                                    </Col>
                                                </Row>


                                                <Form.Item rules={[]} label="Path" name="deployPath"

                                                >
                                                    <Input
                                                        size="large"
                                                        style={{ width: '100%' }}
                                                    />
                                                </Form.Item>
                                                <Form.Item rules={[]} label="Difficulty Level" name="deployDifficultyLevel"

                                                >
                                                    <Select style={{ textAlign: 'left' }} size="large" options={
                                                        network === 'mainnet' ? new Array(10).fill(null).map((_, i) => {
                                                            return { label: `Lv${i + 5}`, value: i + 5 }
                                                        }) : new Array(14).fill(null).map((_, i) => {
                                                            return { label: `Lv${i}`, value: i }
                                                        })}>

                                                    </Select>
                                                </Form.Item>

                                                <Form.Item rules={[]} label="Count" name="deployCount"

                                                >
                                                    <InputNumber
                                                        size="large"
                                                        style={{ width: '100%' }}
                                                        min={0}
                                                        precision={0}
                                                    />
                                                </Form.Item></>
                                        }
                                    ]}>

                                    </Collapse>




                                </>
                            }
                            if (type === 'transfer') {
                                return <>
                                    <Form.Item label="Token" name="transferTickerId"
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
                                            precision={transferPrecision}
                                        />
                                    </Form.Item>
                                    <Form.Item label="Recipient Address" name="recipient" rules={[{ required: true }]}>
                                        <Input
                                            size="large"
                                        />
                                    </Form.Item></>
                            }
                            if (type === 'mint') {
                                return <>

                                    <Form.Item label="Ticker / Token ID" name="tickerId" rules={[{ required: true }]} validateStatus={mintInfoStatus}
                                        help={mintInfoStatus === 'error' ? <div style={{ textAlign: 'left' }}>This Ticker / Token ID does not correspond to any MRC-20; Please re-enter.</div> : <></>} >
                                        <Input
                                            size="large"
                                            onChange={handleMintTokenIDChange}
                                        />
                                    </Form.Item>
                                    <Row gutter={[0, 0]}>
                                        <Col offset={sm ? 5 : 0} span={sm ? 19 : 24}> <Spin spinning={mintInfoLoading}>
                                            {
                                                IdCoinInfo && <> <div style={{ color: 'var(--primary)', marginBottom: 20 }}>Detail</div><IdCoinCard mintMrc20Info={IdCoinInfo} /></>
                                            }

                                            {
                                                (!IdCoinInfo && mintMrc20Info) && <> <div style={{ color: 'var(--primary)', marginBottom: 20 }}>Detail</div><MRC20DetailCard mintMrc20Info={mintMrc20Info} /></>
                                            }
                                        </Spin>
                                        </Col>
                                    </Row>
                                    {((!IdCoinInfo || (IdCoinInfo && addressMintState === 1)) && mintMrc20Info && Number(mintMrc20Info.pinCheck.count) > 0) && <>
                                        {(shovel && shovel.length > 0) ?
                                            <Row gutter={[0, 0]}>
                                                <Col offset={sm ? 5 : 0} span={sm ? 19 : 24}>
                                                    <Collapse ghost defaultActiveKey={1} style={{ padding: 0, marginBottom: 20 }} expandIconPosition='end' items={
                                                        [{
                                                            key: 1,
                                                            label: <div style={{ textAlign: 'left' }}>PINs {mintMrc20Info.pinCheck.count && `(Select  ${mintMrc20Info.pinCheck.count} PINs)`}  <Tooltip title="MRC-20 has a unique and innovative difficulty setting called PoP (Proof of PIN). Users can generate and obtain an NFT called a PIN by generating MetaID interaction transactions. Each PIN has corresponding attributes, including rarity, path, etc. The deployer can decide that during the MRC-20 minting process, users need to provide corresponding PIN proofs to obtain minting eligibility.">
                                                                <QuestionCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                                            </Tooltip></div>,
                                                            children: <Form.Item label='' labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} name="pins" rules={[{ required: true }]}

                                                            >
                                                                {/* <Checkbox.Group style={{ display: 'flex' }} >
                                                                    <Row style={{ borderRadius: 8, overflow: 'hidden', maxHeight: 200, overflowY: 'scroll' }}>
                                                                        {shovel?.map(item => {
                                                                            return <Col span={24} key={item.id}><Checkbox  className="customCheckbox" value={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row-reverse' }}>
                                                                                <div className="value">#{item.number} <a href={`https://man${network === 'mainnet' ? '' : '-test'}.metaid.io/pin/${item.id}`} target='_blank'>  <ArrowRightOutlined style={{ color: 'rgba(255, 255, 255, 0.5)', transform: 'rotate(-0.125turn)' }} /></a> </div></Checkbox></Col>
                                                                        })}

                                                                    </Row></Checkbox.Group> */}
                                                                <SelectPins shovel={shovel} count={Number(mintMrc20Info.pinCheck.count)} network={network} />
                                                            </Form.Item>
                                                        }]
                                                    }></Collapse>
                                                </Col></Row> : <Row gutter={[0, 0]}>
                                                <Col offset={sm ? 5 : 0} span={sm ? 19 : 24}><div className="noPins" onClick={() => { history.push('/?tab=PIN') }}><FileTextOutlined style={{ fontSize: 36 }} /><div>
                                                    No eligible PIN. Go get one.
                                                </div></div></Col></Row>
                                        }
                                    </>}

                                </>
                            }
                            return null;
                        }
                    }
                </Form.Item>








            </Form>
        </ConfigProvider>
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
                        onClick={beforeSubmit}

                        className="submit"
                        disabled={mintMrc20Info && mintMrc20Info.mintable === false}
                    >
                        {type === 'deploy' ? 'Deploy' : type === 'mint' ? (mintMrc20Info && mintMrc20Info.mintable === false) ? 'Non-mintable' : 'Mint' : 'Transfer'}
                    </Button>
                )}
            </Col>
        </Row>
        <DeployComfirm {...deployComfirmProps} submiting={submiting} />
        <SuccessModal {...successProp}></SuccessModal>
        <ComfirmMintIdCoin show={comfirmVisible} onClose={() => { setComfirmVisible(false) }} idCoin={IdCoinInfo} order={mintIdCoinOrder} submiting={submiting} handleSubmit={submit} />
    </div>

} 
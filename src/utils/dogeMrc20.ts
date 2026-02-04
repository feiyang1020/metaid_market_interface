/**
 * Doge 链 MRC-20 工具函数
 * 
 * 与 BTC 链的主要区别：
 * 1. 只支持 P2PKH 地址类型 (D... 开头)
 * 2. Dust limit 为 100,000 satoshis (0.001 DOGE)
 * 3. 默认输出值为 1,000,000 satoshis (0.01 DOGE)
 * 4. 费率单位是 sat/KB (比 BTC 的 sat/vByte 大得多)
 */

import {
  networks,
  Psbt,
  address as addressLib,
  initEccLib,
  Transaction,
  payments,
  Network,
} from "bitcoinjs-lib";
import Decimal from "decimal.js";
import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";
import {
  SIGHASH_ALL,
  SIGHASH_ALL_ANYONECANPAY,
  SIGHASH_SINGLE_ANYONECANPAY,
} from "./orders";
import { getRawTx, getDogeRawTx } from "@/services/api";
import { DOGE_DUST_LIMIT, DOGE_DEFAULT_OUTPUT_VALUE } from "@/config";
import { dogeNetworkParams } from "./doge";
import { createPsbtInput, getUtxos, buildTx, getNetworks, calcFee } from "./psbtBuild";
import { determineAddressInfo } from "./utlis";

// Doge 网络配置
export const dogeNetwork: Network = {
  messagePrefix: "\x19Dogecoin Signed Message:\n",
  bech32: "",
  bip32: {
    public: 0x02facafd,
    private: 0x02fac398,
  },
  pubKeyHash: 0x1e,
  scriptHash: 0x16,
  wif: 0x9e,
};

// 获取 Doge 网络配置
export const getDogeNetwork = (): Network => {
  return dogeNetwork;
};

// 获取 Doge UTXO
export const getDogeUtxos = async (address: string): Promise<API.UTXO[]> => {
  if (!window.metaidwallet?.doge?.getUtxos) {
    throw new Error("Doge wallet not available");
  }
  const utxos = await window.metaidwallet.doge.getUtxos();
  return (utxos ?? []).map((utxo: any) => ({
    txId: utxo.txId || utxo.txid,
    vout: utxo.vout ?? utxo.outputIndex,
    outputIndex: utxo.outputIndex ?? utxo.vout,
    satoshis: utxo.satoshis ?? utxo.satoshi,
    satoshi: utxo.satoshi ?? utxo.satoshis,
    confirmed: utxo.confirmed ?? true,
    rawTx: utxo.rawTx,
  }));
};

// 创建 Doge PSBT 输入
export const createDogePsbtInput = async (params: {
  utxo: API.UTXO;
  publicKey: Buffer;
  network?: API.Network;
}) => {
  const { utxo, publicKey, network = "mainnet" } = params;
  
  // 获取原始交易
  let rawTx = utxo.rawTx;
  if (!rawTx) {
    const { data } = await getDogeRawTx(network, { txid: utxo.txId });
    rawTx = data.hex;
  }
  
  const tx = Transaction.fromHex(rawTx);
  const outputIndex = utxo.outputIndex ?? utxo.vout;
  
  // Doge 只支持 P2PKH，使用 nonWitnessUtxo
  return {
    hash: utxo.txId,
    index: outputIndex,
    nonWitnessUtxo: tx.toBuffer(),
    sighashType: SIGHASH_ALL,
  };
};

/**
 * Doge MRC-20 List 订单
 * 创建卖单 PSBT
 */
export const listDogeMrc20Order = async (
  utxo: API.UTXO,
  price: number, // 以 satoshis 为单位的 DOGE 价格
  network: API.Network,
  address: string
): Promise<string> => {
  initEccLib(ecc);
  
  if (!window.metaidwallet?.doge) {
    throw new Error("Doge wallet not available");
  }
  
  const publicKey = await window.metaidwallet.doge.getPublicKey();
  
  // 获取原始交易
  let rawTx = utxo.rawTx;
  if (!rawTx) {
    const { data } = await getDogeRawTx(network, { txid: utxo.txId });
    rawTx = data.hex;
  }
  
  const ordinalPreTx = Transaction.fromHex(rawTx);
  const outputIndex = utxo.outputIndex ?? utxo.vout;
  
  // 创建 Ask PSBT
  const ask = new Psbt({ network: dogeNetwork });
  
  // Doge 使用 P2PKH，需要用 nonWitnessUtxo
  // 添加一个假的输入用于 P2PKH 签名 workaround
  const fakeTxid = "0000000000000000000000000000000000000000000000000000000000000000";
  ask.addInput({
    hash: fakeTxid,
    index: 0,
    nonWitnessUtxo: ordinalPreTx.toBuffer(),
    sighashType: SIGHASH_SINGLE_ANYONECANPAY,
  });
  
  // 添加 MRC-20 UTXO 作为输入
  ask.addInput({
    hash: utxo.txId,
    index: outputIndex,
    nonWitnessUtxo: ordinalPreTx.toBuffer(),
    sighashType: SIGHASH_SINGLE_ANYONECANPAY,
  });
  
  // 假输出
  const fakeOutScript = Buffer.from(
    "76a914000000000000000000000000000000000000000088ac",
    "hex"
  );
  ask.addOutput({
    script: fakeOutScript,
    value: 0,
  });
  
  // 添加卖出价格输出
  ask.addOutput({
    address,
    value: price,
  });
  
  // 签名 - 使用 btc 的 signPsbt，因为钱包可能还没有 doge.signPsbt
  // 需要检查钱包是否支持
  let signed: string;
  if (window.metaidwallet.doge.signPsbt) {
    const result = await window.metaidwallet.doge.signPsbt({
      psbtHex: ask.toHex(),
      options: {
        autoFinalized: true,
      },
    });
    if (typeof result === "object") {
      if (result.status === "canceled") throw new Error("canceled");
      throw new Error("Sign failed");
    }
    signed = result;
  } else {
    // 回退到 btc.signPsbt
    const result = await window.metaidwallet.btc.signPsbt({
      psbtHex: ask.toHex(),
      options: {
        autoFinalized: true,
      },
    });
    if (typeof result === "object") {
      if (result.status === "canceled") throw new Error("canceled");
      throw new Error("Sign failed");
    }
    signed = result;
  }
  
  return signed;
};

/**
 * 构建 Doge MRC-20 购买 PSBT
 */
type DogeBuyMrc20Params = {
  address: string;
  publicKey: Buffer;
  network: API.Network;
} & API.BuyOrderPsbtRes;

const _buildDogeBuyMrc20TakePsbt = async (
  params: DogeBuyMrc20Params,
  selectedUTXOs: API.UTXO[],
  change: Decimal,
  needChange: boolean,
  signPsbt: boolean = true
) => {
  const { address, publicKey, network, takePsbt } = params;
  
  // 从服务端返回的 PSBT 开始
  const psbt = Psbt.fromHex(takePsbt, {
    network: dogeNetwork,
  });
  
  let toSignIndex = psbt.data.inputs.length;
  const toSignInputs: { index: number; address: string; sighashTypes: number[] }[] = [];
  
  // 添加支付 UTXO
  for (const utxo of selectedUTXOs) {
    let rawTx = utxo.rawTx;
    if (!rawTx) {
      const { data } = await getDogeRawTx(network, { txid: utxo.txId });
      rawTx = data.hex;
    }
    const tx = Transaction.fromHex(rawTx);
    
    psbt.addInput({
      hash: utxo.txId,
      index: utxo.outputIndex ?? utxo.vout,
      nonWitnessUtxo: tx.toBuffer(),
      sighashType: SIGHASH_ALL,
    });
    
    toSignInputs.push({
      index: toSignIndex,
      address,
      sighashTypes: [SIGHASH_ALL],
    });
    toSignIndex += 1;
  }
  
  // 添加找零输出
  if (needChange || change.gt(DOGE_DUST_LIMIT)) {
    psbt.addOutput({
      address,
      value: change.toNumber(),
    });
  }
  
  if (!signPsbt) {
    return psbt;
  }
  
  // 签名
  let signed: string;
  if (window.metaidwallet.doge?.signPsbt) {
    const result = await window.metaidwallet.doge.signPsbt({
      psbtHex: psbt.toHex(),
      options: {
        toSignInputs,
        autoFinalized: false,
      },
    });
    if (typeof result === "object") {
      if (result.status === "canceled") throw new Error("canceled");
      throw new Error("Sign failed");
    }
    signed = result;
  } else {
    const result = await window.metaidwallet.btc.signPsbt({
      psbtHex: psbt.toHex(),
      options: {
        toSignInputs,
        autoFinalized: false,
      },
    });
    if (typeof result === "object") {
      if (result.status === "canceled") throw new Error("canceled");
      throw new Error("Sign failed");
    }
    signed = result;
  }
  
  // Return signed PSBT (server will finalize and broadcast)
  return Psbt.fromHex(signed, { network: dogeNetwork });
};

/**
 * 构建 Doge MRC-20 购买交易
 */
export const buildDogeBuyMrc20TakePsbt = async (
  order: API.BuyOrderPsbtRes,
  network: API.Network,
  feeRate: number,
  manualCalcFee: boolean = true,
  signPsbt: boolean = false
): Promise<{
  rawTx: string;
  psbt: Psbt;
  fee: number;
  totalSpent: number;
  txOutputs: any[];
  error?: string;
}> => {
  initEccLib(ecc);
  
  if (!window.metaidwallet?.doge) {
    throw new Error("Doge wallet not available");
  }
  
  const { fee, priceAmount, outValue } = order;
  const address = await window.metaidwallet.doge.getAddress();
  const publicKey = await window.metaidwallet.doge.getPublicKey();
  
  // 获取 UTXO
  const utxos = (await getDogeUtxos(address)).sort(
    (a, b) => b.satoshi - a.satoshi
  );
  
  if (utxos.length === 0) {
    throw new Error("No DOGE UTXOs available");
  }
  
  // 计算所需金额
  const requiredAmount = new Decimal(fee + priceAmount);
  
  // 选择 UTXO
  let totalInput = new Decimal(0);
  const selectedUTXOs: API.UTXO[] = [];
  for (const utxo of utxos) {
    selectedUTXOs.push(utxo);
    totalInput = totalInput.add(utxo.satoshi);
    // 预估费用 (每个输入约 148 bytes for P2PKH)
    const estimatedSize = selectedUTXOs.length * 148 + 34 * 2 + 10;
    const estimatedFee = Math.ceil(estimatedSize * feeRate / 1000); // sat/KB -> sat
    if (totalInput.gte(requiredAmount.add(estimatedFee).add(DOGE_DUST_LIMIT))) {
      break;
    }
  }
  
  // 计算找零
  const estimatedSize = selectedUTXOs.length * 148 + 34 * 2 + 10;
  const estimatedFee = Math.ceil(estimatedSize * feeRate / 1000);
  const change = totalInput.sub(requiredAmount).sub(estimatedFee);
  const needChange = change.gt(DOGE_DUST_LIMIT);
  
  if (totalInput.lt(requiredAmount.add(estimatedFee))) {
    throw new Error("Insufficient DOGE balance");
  }
  
  const psbt = await _buildDogeBuyMrc20TakePsbt(
    {
      address,
      publicKey: Buffer.from(publicKey, "hex"),
      network,
      ...order,
    },
    selectedUTXOs,
    change,
    needChange,
    signPsbt
  );
  
  const totalSpent = Number(estimatedFee) + Number(priceAmount) + Number(fee) - Number(outValue);
  
  return {
    // Return PSBT hex (not extracted transaction) - server expects PSBT format
    rawTx: signPsbt ? psbt.toHex() : "",
    psbt,
    fee: estimatedFee,
    totalSpent,
    txOutputs: psbt.txOutputs,
  };
};

/**
 * 执行 Doge MRC-20 购买
 */
export const buyDogeMrc20Order = async (
  order: API.BuyOrderPsbtRes,
  network: API.Network,
  feeRate: number
): Promise<{ rawTx: string; txOutputs: any[] }> => {
  const { rawTx, txOutputs } = await buildDogeBuyMrc20TakePsbt(
    order,
    network,
    feeRate,
    false,
    true
  );
  return { rawTx, txOutputs };
};

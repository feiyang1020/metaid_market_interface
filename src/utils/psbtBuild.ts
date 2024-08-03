import { Decimal } from "decimal.js";
import {
  Psbt,
  Transaction,
  address as libAddress,
  payments,
  networks,
} from "bitcoinjs-lib";
import mempoolJS from "@mempool/mempool.js";
import { isTaprootInput } from "bitcoinjs-lib/src/psbt/bip371";
import { toXOnly } from "./orders";
import { determineAddressInfo } from "./utlis";

const TX_EMPTY_SIZE = 4 + 1 + 1 + 4;
const TX_INPUT_BASE = 32 + 4 + 1 + 4; // 41
const TX_INPUT_PUBKEYHASH = 107;
const TX_INPUT_PUBKEY_HASH = 107;
const TX_INPUT_SEGWIT = 27;
const TX_INPUT_TAPROOT = 17; // round up 16.5 bytes
const TX_OUTPUT_BASE = 8 + 1;
const TX_OUTPUT_PUBKEYHASH = 25;
const TX_OUTPUT_SCRIPTHASH = 23;
const TX_OUTPUT_SEGWIT = 22;
const TX_OUTPUT_SEGWIT_SCRIPTHASH = 34;
const TX_INPUT_SCRIPT_BASE = 0;
const TX_OUTPUT_SEGWIT_SCRIPT_HASH = 34;
const TX_OUTPUT_SCRIPT_HASH = 23;
const TX_OUTPUT_PUBKEY_HASH = 25;

function selectUTXOs(utxos: API.UTXO[], targetAmount: Decimal) {
  let totalAmount = new Decimal(0);
  const selectedUtxos: typeof utxos = [];
  for (const utxo of utxos) {
    selectedUtxos.push(utxo);
    totalAmount = totalAmount.add(utxo.satoshis);

    if (totalAmount.gte(targetAmount)) {
      break;
    }
  }

  if (totalAmount.lt(targetAmount)) {
    throw new Error(
      "No available UTXOs. Please wait for existing transactions to be confirmed. "
    );
  }

  return selectedUtxos;
}

function getTotalSatoshi(utxos: API.UTXO[]) {
  return utxos.reduce(
    (total, utxo) => total.add(utxo.satoshis),
    new Decimal(0)
  );
}
function calculateEstimatedFee(psbt: Psbt, feeRate: number) {
  const tx = psbt.extractTransaction();
  const size = tx.virtualSize();
  return new Decimal(size).mul(feeRate);
}
type PsbtInput = (typeof Psbt.prototype.data.inputs)[0];
export interface TransactionOutput {
  script: Buffer;
  value: number;
}
export interface PsbtTxOutput extends TransactionOutput {
  address: string | undefined;
}

function inputBytes(input: PsbtInput) {
  return (
    TX_INPUT_BASE +
    (input.redeemScript ? input.redeemScript.length : 0) +
    (input.witnessScript
      ? input.witnessScript.length / 4
      : isTaprootInput(input)
        ? TX_INPUT_TAPROOT
        : input.witnessUtxo
          ? TX_INPUT_SEGWIT
          : !input.redeemScript
            ? TX_INPUT_PUBKEY_HASH
            : 0)
  );
}

function outputBytes(output: PsbtTxOutput) {
  return (
    TX_OUTPUT_BASE +
    (output.script
      ? output.script.length
      : output.address?.startsWith("bc1") || output.address?.startsWith("tb1")
        ? output.address?.length === 42
          ? TX_OUTPUT_SEGWIT
          : TX_OUTPUT_SEGWIT_SCRIPT_HASH
        : output.address?.startsWith("3") || output.address?.startsWith("2")
          ? TX_OUTPUT_SCRIPT_HASH
          : TX_OUTPUT_PUBKEY_HASH)
  );
}
function transactionBytes(
  inputs: PsbtInput[],
  outputs: PsbtTxOutput[],
  isTaproot = false
) {
  const inputsSize = inputs.reduce(function (a, x) {
    return a + inputBytes(x);
  }, 0);
  const outputsSize = outputs.reduce(function (a, x, index) {
    return a + outputBytes(x);
  }, 0);
  if (isTaproot) {
    return TX_EMPTY_SIZE + Math.floor(inputsSize) + 1 + outputsSize;
  }

  return TX_EMPTY_SIZE + inputsSize + outputsSize;
}
function calcSize(psbt: Psbt, isTaproot = false) {
  const inputs = psbt.data.inputs;

  const outputs = psbt.txOutputs;

  return transactionBytes(inputs, outputs, isTaproot);
}

export function calcFee(psbt: Psbt, feeRate: number, isTaproot = false) {
  const inputs = psbt.data.inputs;
  const outputs = psbt.txOutputs;

  const bytes = transactionBytes(inputs, outputs, isTaproot);
  console.log({ bytes });
  return new Decimal(bytes).mul(feeRate);
}

export async function buildTx<T>(
  utxos: API.UTXO[],
  amount: Decimal,
  feeRate: number,
  buildPsbtParams: T,
  address: string,
  buildPsbt: (
    buildPsbtParams: T,
    selectedUTXOs: API.UTXO[],
    change: Decimal,
    needChange: boolean,
    signPsbt?: boolean
  ) => Promise<Psbt>,
  extract: boolean = false,
  signPsbt: boolean = true
): Promise<{
  psbt: Psbt;
  fee: string;
  txId: string;
  rawTx: string;
  txInputs: API.Tx[];
  txOutputs: API.Tx[];
}> {
  let selectedUTXOs = selectUTXOs(utxos, amount);
  let total = getTotalSatoshi(selectedUTXOs);
  let psbt = await buildPsbt(
    buildPsbtParams,
    selectedUTXOs,
    total.minus(amount),
    true,
    false
  );
   
  // let estimatedFee = manualCalcFee
  //   ? calcFee(psbt, feeRate)
  //   : calculateEstimatedFee(psbt, feeRate);
  const addressType = determineAddressInfo(address).toUpperCase();
  let estimatedFee = calcFee(psbt, feeRate,addressType==='P2TR');
  console.log(estimatedFee.toFixed(0), "estimatedFee");
  while (total.lt(amount.add(estimatedFee))) {
    if (selectedUTXOs.length === utxos.length) {
      throw new Error("Insufficient funds");
    }
    selectedUTXOs = selectUTXOs(utxos, amount.add(estimatedFee));
    total = getTotalSatoshi(selectedUTXOs);
    psbt = await buildPsbt(
      buildPsbtParams,
      selectedUTXOs,
      total.minus(amount.add(estimatedFee)),
      true,
      false
    );
    estimatedFee = calcFee(psbt, feeRate,addressType==='P2TR');
    // estimatedFee = manualCalcFee
    //   ? calcFee(psbt, feeRate)
    //   : calculateEstimatedFee(psbt, feeRate);
  }

  psbt = await buildPsbt(
    buildPsbtParams,
    selectedUTXOs,
    total.minus(amount.add(estimatedFee)),
    false,
    signPsbt
  );


  console.log(
    estimatedFee.toString(),
    total
      .minus(psbt.txOutputs.reduce((acc, cur) => acc + Number(cur.value), 0))
      .toString()
      ,'estimatedFee'
  );
  return {
    psbt,
    fee:  estimatedFee.toString(),
    txId: !extract ? "" : psbt.extractTransaction().getId(),
    rawTx: !extract ? psbt.toHex() : psbt.extractTransaction().toHex(),
    txInputs: selectedUTXOs.map((utxo) => ({
      address,
      value: utxo.satoshis,
    })),
    txOutputs: psbt.txOutputs.map((out, index) => ({
      address: out.address || "",
      value: out.value,
      vout: index,
    })),
  };
}

export async function createPsbtInput({
  utxo,
  addressType,
  publicKey,
  script,
  network,
}: {
  utxo: API.UTXO;
  publicKey: Buffer;
  script: Buffer;
  addressType: string;
  network?: API.Network;
}) {
  const payInput: any = {
    hash: utxo.txId,
    index: utxo.vout,

    sequence: 0xffffffff, // These are defaults. This line is not needed.
  };
  if (["P2TR"].includes(addressType)) {
    console.log("input.tapInternalKey", publicKey.subarray(1));
    const tapInternalKey = toXOnly(publicKey);

    payInput["tapInternalKey"] = tapInternalKey;
    payInput["witnessUtxo"] = { value: utxo.satoshi, script };
  }
  if (["P2WPKH"].includes(addressType)) {
    payInput["witnessUtxo"] = { value: utxo.satoshi, script };
  }
  if (["P2PKH"].includes(addressType)) {
    const mempoolReturn = mempoolJS({
      hostname: "mempool.space",
      network: network === "mainnet" ? "main" : "testnet",
    });
    const rawTx = await mempoolReturn.bitcoin.transactions.getTxHex({
      txid: utxo.txId,
    });
    const tx = Transaction.fromHex(rawTx);
    payInput["nonWitnessUtxo"] = tx.toBuffer();
  }
  if (["P2SH"].includes(addressType)) {
    console.log("input.tapInternalKey");
    const { redeem } = payments.p2sh({
      redeem: payments.p2wpkh({
        pubkey: publicKey,
        network: networks.testnet,
      }),
      network: networks.testnet,
    });
    if (!redeem) throw new Error("redeemScript");
    payInput.redeemScript = redeem.output;
    payInput["witnessUtxo"] = { value: utxo.satoshi, script };
  }
  return payInput;
}

export async function fillInternalKey({
  publicKey,
  addressType,
  txId,
}: {
  publicKey: Buffer;
  addressType: string;
  txId?: string;
}) {
  const payInput: any = {};
  if (["P2TR"].includes(addressType)) {
    const tapInternalKey = toXOnly(publicKey);
    payInput["tapInternalKey"] = tapInternalKey;
  }

  // if (['P2PKH'].includes(addressType)&&txId) {
  //   const mempoolReturn = mempoolJS({
  //     hostname: 'mempool.space',
  //     network: 'testnet',
  //   })
  //   const rawTx = await mempoolReturn.bitcoin.transactions.getTxHex({
  //     txid: txId,
  //   })
  //   const tx = Transaction.fromHex(rawTx)
  //   console.log('input.nonWitnessUtxo')
  //   payInput['nonWitnessUtxo'] = tx.toBuffer()
  // }

  if (["P2SH"].includes(addressType)) {
    console.log("input.tapInternalKey");
    const { redeem } = payments.p2sh({
      redeem: payments.p2wpkh({
        pubkey: publicKey,
        network: networks.testnet,
      }),
      network: networks.testnet,
    });
    if (!redeem) throw new Error("redeemScript");
    payInput.redeemScript = redeem.output;
  }
  return payInput;
}

export const getUtxos = async (address: string, network: API.Network) => {
  // const mempoolReturn = mempoolJS({
  //   hostname: "mempool.space",
  //   network: network === "mainnet" ? "main" : "testnet",
  // });
  // const rawUtxoList = await mempoolReturn.bitcoin.addresses.getAddressTxsUtxo({
  //   address,
  // });
  // const utxos: API.UTXO[] = [];
  // for (const utxoElement of rawUtxoList) {
  //   if (utxoElement.value > 1000) {
  //     utxos.push({
  //       txId: utxoElement.txid,
  //       vout: utxoElement.vout,
  //       satoshi: utxoElement.value,
  //       confirmed: utxoElement.status.confirmed,
  //       inscriptions: null,
  //       outputIndex: utxoElement.vout,
  //       satoshis: utxoElement.value,
  //     });
  //   }
  // }
  //
  const addressType = determineAddressInfo(address).toUpperCase();
  const utxos = await window.metaidwallet.btc.getUtxos({
    needRawTx: ["P2PKH"].includes(addressType),
    useUnconfirmed: true,
  });
  console.log(utxos, "utxos");
  for (let i = 0; i < utxos.length; i++) {
    const { txId, vout } = utxos[i];
    if (!utxos[i].confirmed) {
      const ret = await window.metaidwallet.btc.addSafeUtxo({
        address,
        unspentOutput: `${txId}:${vout}`,
      });
      console.log(ret, "addSafeUtxo");
    }
  }
  return utxos;
};

export const addUtxoSafe = async (
  address: string,
  utxos: { txId: string; vout: number }[]
) => {
  console.log(utxos, "addUtxoSafe");
  for (let i = 0; i < utxos.length; i++) {
    try {
      const { txId, vout } = utxos[i];
      const ret = await window.metaidwallet.btc.addSafeUtxo({
        address,
        unspentOutput: `${txId}:${vout}`,
      });
      console.log(ret, "addUtxoSafe");
    } catch (err) {
      console.log(err);
    }
  }
};

export const getNetworks = (network: API.Network) => {
  return network === "mainnet" ? networks.bitcoin : networks.testnet;
};

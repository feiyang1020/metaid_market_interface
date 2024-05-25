import { getRawTx } from "@/services/api";
import {
  Psbt,
  Transaction,
  networks,
  payments,
  address as libAddress,
  TxOutput,
  initEccLib,
} from "bitcoinjs-lib";
import { isTaprootInput } from "bitcoinjs-lib/src/psbt/bip371";
import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";
import { Output } from "bitcoinjs-lib/src/transaction";
import Decimal from "decimal.js";
import { determineAddressInfo } from "./utlis";

export type SimpleUtxo = {
  txId: string;
  satoshis: number;
  outputIndex: number;
  confirmed?: boolean;
};
export interface TransactionOutput {
  script: Buffer;
  value: number;
}
export interface PsbtTxOutput extends TransactionOutput {
  address: string | undefined;
}

export const SIGHASH_SINGLE_ANYONECANPAY = 0x83;
export const SIGHASH_SINGLE = 0x03
export const DUST_UTXO_VALUE = 546;
export const MS_BRC20_UTXO_VALUE = 1000;
export const SIGHASH_ALL_ANYONECANPAY = 0x81;
export const USE_UTXO_COUNT_LIMIT = 5;
export const SIGHASH_ALL = 0x01;
export const BUY_PAY_INPUT_INDEX = 4;
const TX_EMPTY_SIZE = 4 + 1 + 1 + 4;
const TX_INPUT_BASE = 32 + 4 + 1 + 4; // 41
const TX_INPUT_PUBKEYHASH = 107;
const TX_INPUT_SEGWIT = 27;
const TX_INPUT_TAPROOT = 17; // round up 16.5 bytes
const TX_OUTPUT_BASE = 8 + 1;
const TX_OUTPUT_PUBKEYHASH = 25;
const TX_OUTPUT_SCRIPTHASH = 23;
const TX_OUTPUT_SEGWIT = 22;
const TX_OUTPUT_SEGWIT_SCRIPTHASH = 34;

type PsbtInput = (typeof Psbt.prototype.data.inputs)[0];
type PsbtInputExtended = PsbtInput & {
  hash: string;
  index: number;
};

export function toXOnly(pubKey: Buffer) {
  return pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);
}

function inputBytes(input: PsbtInput) {
  // todo: script length
  if (isTaprootInput(input)) {
    return TX_INPUT_BASE + TX_INPUT_TAPROOT;
  }

  if (input.witnessUtxo) return TX_INPUT_BASE + TX_INPUT_SEGWIT;

  return TX_INPUT_BASE + TX_INPUT_PUBKEYHASH;

  // return (
  //   TX_INPUT_BASE +
  //   (input.script
  //     ? input.script.length
  //     : input.isTaproot
  //     ? TX_INPUT_TAPROOT
  //     : input.witnessUtxo
  //     ? TX_INPUT_SEGWIT
  //     : TX_INPUT_PUBKEYHASH)
  // )
}

function outputBytes(output: PsbtTxOutput) {
  // if output is op-return, use it's buffer size

  return (
    TX_OUTPUT_BASE +
    (output.script
      ? output.script.length
      : output.address?.startsWith("bc1") || output.address?.startsWith("tb1")
      ? output.address?.length === 42 // TODO: looks like something wrong here
        ? TX_OUTPUT_SEGWIT
        : TX_OUTPUT_SEGWIT_SCRIPTHASH
      : output.address?.startsWith("3") || output.address?.startsWith("2")
      ? TX_OUTPUT_SCRIPTHASH
      : TX_OUTPUT_PUBKEYHASH)
  );
}

function transactionBytes(inputs: PsbtInput[], outputs: PsbtTxOutput[]) {
  const inputsSize = inputs.reduce(function (a, x) {
    return a + inputBytes(x);
  }, 0);
  const outputsSize = outputs.reduce(function (a, x, index) {
    return a + outputBytes(x);
  }, 0);

  console.log({
    inputsSize,
    outputsSize,
    TX_EMPTY_SIZE,
  });
  return TX_EMPTY_SIZE + inputsSize + outputsSize;
}

export function calcFee(
  psbt: Psbt,
  feeRate: number,
  extraSize: number = 31 // 31 is the size of the segwit change output
  // extraInputValue?: number
) {
  const inputs = psbt.data.inputs;
  const outputs = psbt.txOutputs;

  let bytes = transactionBytes(inputs, outputs);
  if (extraSize) {
    bytes += extraSize;
  }
  console.log({ bytes });

  let fee = Math.ceil(bytes * feeRate);
  // if (extraInputValue) {
  //   fee -= extraInputValue
  // }

  return fee;
}

export function fillInternalKey<T extends PsbtInput | PsbtInputExtended>(
  input: T,
  address: string,
  pubKey: string
): T {
  // check if the input is mine, and address is Taproot
  // if so, fill in the internal key

  const isP2TR = address.startsWith("bc1p") || address.startsWith("tb1p");
  const lostInternalPubkey = !input.tapInternalKey;

  if (isP2TR && lostInternalPubkey) {
    const tapInternalKey = toXOnly(Buffer.from(pubKey, "hex"));
    const { output } = payments.p2tr({
      internalPubkey: tapInternalKey,
    });
    if (input.witnessUtxo?.script.toString("hex") == output!.toString("hex")) {
      input.tapInternalKey = tapInternalKey;
    }
  }

  return input;
}

export function safeOutputValue(value: number | Decimal, isMs = false): number {
  const threshold = isMs ? MS_BRC20_UTXO_VALUE : DUST_UTXO_VALUE;

  // if value is less than 1k sats, throw an error
  if (typeof value === "number") {
    if (value < threshold) {
      throw new Error(
        `The amount you are trying is too small. Maybe try a larger amount.`
      );
    }
  } else {
    if (value.lessThan(threshold)) {
      throw new Error(
        `The amount you are trying is too small. Maybe try a larger amount.`
      );
    }
  }

  // make sure value is a whole number
  if (typeof value === "number") {
    return Math.round(value);
  }

  return value.round().toNumber();
}

function uintOrNaN(v: any) {
  if (typeof v !== "number") return NaN;
  if (!isFinite(v)) return NaN;
  if (Math.floor(v) !== v) return NaN;
  if (v < 0) return NaN;
  return v;
}

function sumOrNaN(txOutputs: TxOutput[] | Output[]) {
  return txOutputs.reduce(function (a: number, x: any) {
    return a + uintOrNaN(x.value);
  }, 0);
}
export const raise = (err: string): never => {
  throw new Error(err);
};

function getWitnessUtxo(out: any): any {
  delete out.address;
  out.script = Buffer.from(out.script, "hex");
  return out;
}

export async function exclusiveChange({
  psbt,
  extraSize,
  useSize,
  extraInputValue,
  maxUtxosCount = 1,
  sighashType = SIGHASH_ALL_ANYONECANPAY,
  otherSighashType,
  estimate = false,
  partialPay = false,
  cutFrom = 1,
  feeb,
  network,
}: {
  psbt: Psbt;
  extraSize?: number;
  useSize?: number;
  extraInputValue?: number;
  maxUtxosCount?: number;
  sighashType?: number;
  otherSighashType?: number;
  estimate?: boolean;
  partialPay?: boolean;
  cutFrom?: number;
  feeb: number;
  network: API.Network;
}) {
  // check if feeb is set

  // check if address is set
  initEccLib(ecc);
  // check if useSize is set but maxUtxosCount is larger than 1
  if (useSize && maxUtxosCount > 1) {
    throw new Error(
      "useSize and maxUtxosCount cannot be set at the same time."
    );
  }

  // Add payment input
  const address = await window.metaidwallet.btc.getAddress();
  const filtered = await window.metaidwallet.btc.getUtxos();
  const pubKey = await window.metaidwallet.btc.getPublicKey();
  const paymentUtxos = filtered
    .sort((a, b) => {
      return b.satoshis - a.satoshis;
    })
    .slice(0, maxUtxosCount);

  if (!paymentUtxos.length) {
    throw new Error(
      "You have no usable BTC UTXO. Please deposit more BTC into your address to receive additional UTXO. utxo"
    );
  }

  // construct input
  const btcNetwork =
    network === "mainnet" ? networks.bitcoin : networks.testnet;
  const paymentPrevOutputScript = libAddress.toOutputScript(
    address,
    btcNetwork
  );

  if (estimate) {
    // if estimating, we assume a payment utxo that is absurdly large
    const paymentUtxo = {
      txId: "8729586f5352810db997e2ae0f1530ccc6f63740ba09d656da78e6a7751e7a86",
      outputIndex: 0,
      satoshis: 100 * 1e8, // 100 btc
    };
    const paymentWitnessUtxo = {
      value: paymentUtxo.satoshis,
      script: paymentPrevOutputScript,
    };
    const paymentInput = {
      hash: paymentUtxo.txId,
      index: paymentUtxo.outputIndex,
      witnessUtxo: paymentWitnessUtxo,
      sighashType,
    };
    fillInternalKey(paymentInput, address, pubKey);
    const vin = psbt.inputCount;
    let psbtClone: Psbt;
    // .clone has bug when there is no input; so we have to manually add the output
    if (vin === 0) {
      psbtClone = new Psbt({
        network: btcNetwork,
      });
      // add outputs manually
      const vout = psbt.txOutputs.length;
      for (let i = 0; i < vout; i++) {
        psbtClone.addOutput(psbt.txOutputs[i]);
      }
    } else {
      psbtClone = psbt.clone();
    }
    psbtClone.addInput(paymentInput);

    // Add change output
    let fee = useSize
      ? Math.round(useSize * feeb)
      : calcFee(psbtClone, feeb, extraSize);
    const totalOutput = sumOrNaN(psbtClone.txOutputs);
    const totalInput = sumOrNaN(
      psbtClone.data.inputs.map(
        (input) =>
          input.witnessUtxo ||
          input.nonWitnessUtxo ||
          raise(
            "Input invalid. Please try again or contact customer service for assistance."
          )
      ) as any
    );
    const changeValue = totalInput - totalOutput - fee + (extraInputValue || 0);
    console.log({
      changeValue,
      fee,
      extraInputValue,
      difference: paymentUtxo.satoshis - changeValue,
    });

    if (changeValue < 0) {
      throw new Error(
        "Insufficient balance. Please ensure that the address has a sufficient balance and try again."
      );
    }

    // return the difference，which means how much we actually paying
    return {
      difference: paymentUtxo.satoshis - changeValue,
      feeb,
      fee,
    };
  }

  // Add in one by one until we have enough value to pay
  // multiple change
  console.log({ paymentUtxos });
  const addressType = determineAddressInfo(address).toUpperCase();
  console.log(addressType, "addressType");
  for (let i = 0; i < paymentUtxos.length; i++) {
    const paymentUtxo = paymentUtxos[i];
    const paymentWitnessUtxo = {
      value: paymentUtxo.satoshis,
      script: paymentPrevOutputScript,
    };

    const toUseSighashType =
      i > 0 && otherSighashType ? otherSighashType : sighashType;
    const paymentInput = {
      hash: paymentUtxo.txId,
      index: paymentUtxo.outputIndex,
      witnessUtxo: paymentWitnessUtxo,
      sighashType: toUseSighashType,
    };
    // if (["P2WPKH"].includes(addressType)) {
    //   paymentInput["witnessUtxo"] = getWitnessUtxo(
    //     tx.outs[paymentUtxo.vout || paymentUtxo.outputIndex]
    //   );
    // }
    if (["P2PKH"].includes(addressType)) {
      const {
        data: { rawTx },
      } = await getRawTx(network, { txid: paymentUtxo.txId });
      const tx = Transaction.fromHex(rawTx);
      paymentInput["nonWitnessUtxo"] = tx.toBuffer();
    }
    fillInternalKey(paymentInput, address, pubKey);

    psbt.addInput(paymentInput);

    // Add change output
    let fee = useSize
      ? Math.round(useSize * feeb)
      : calcFee(psbt, feeb, extraSize);
    let totalInput, totalOutput;
    if (partialPay) {
      // we only pay for the fee and some extra value, not the whole transaction
      totalOutput = 0;
      // totalInput = the inputs we add in now
      totalInput = sumOrNaN(
        psbt.data.inputs
          .slice(cutFrom) // exclude the first input, which is the ordinal input
          .map(
            (input) =>
              input.witnessUtxo ||
              input.nonWitnessUtxo ||
              raise(
                "Input invalid. Please try again or contact customer service for assistance."
              )
          ) as any
      );
    } else {
      // we pay for the whole transaction
      totalOutput = sumOrNaN(psbt.txOutputs);
      totalInput = sumOrNaN(
        psbt.data.inputs.map(
          (input) =>
            input.witnessUtxo ||
            input.nonWitnessUtxo ||
            raise(
              "Input invalid. Please try again or contact customer service for assistance."
            )
        ) as any
      );
    }

    const changeValue = totalInput - totalOutput - fee + (extraInputValue || 0);
    if (changeValue < 0) {
      // if we run out of utxos, throw an error
      if (paymentUtxo === paymentUtxos[paymentUtxos.length - 1]) {
        throw new Error(
          "Insufficient balance. Please ensure that the address has a sufficient balance and try again."
        );
      }

      // otherwise, continue
      continue;
    }

    // we have enough satoshis to pay here, let's change now
    if (changeValue >= DUST_UTXO_VALUE) {
      psbt.addOutput({
        address,
        value: safeOutputValue(changeValue),
      });
    } else {
      fee += safeOutputValue(changeValue);
    }
    console.log({ psbt });

    return {
      psbt,
      fee,
      paymentValue: paymentUtxo.satoshis,
      feeb,
      changeValue,
    };
  }

  throw new Error(
    "Insufficient balance. Please ensure that the address has a sufficient balance and try again."
  );
}
export async function buildAskLimit({
  total,
  utxoId,
  network,
}: {
  total: number;
  utxoId: string;
  network: API.Network;
}) {
  initEccLib(ecc);
  // Get address
  // Step 1: Get the ordinal utxo as input
  // if testnet, we use a cardinal utxo as a fake one
  const btcAddress = await window.metaidwallet.btc.getAddress();
  let ordinalUtxo: SimpleUtxo;

  ordinalUtxo = {
    txId: utxoId.split("_")[0],
    satoshis: 546,
    outputIndex: Number(utxoId.split("_")[1]),
  };

  // fetch and decode rawTx of the utxo\
  const {
    data: { rawTx },
  } = await getRawTx(network, { txid: ordinalUtxo.txId });

  // decode rawTx
  const ordinalPreTx = Transaction.fromHex(rawTx);
  const ordinalDetail = ordinalPreTx.outs[ordinalUtxo.outputIndex];
  const ordinalValue = ordinalDetail.value;
  const btcNetwork =
    network === "mainnet" ? networks.bitcoin : networks.testnet;
  // build psbt
  const ask = new Psbt({ network: btcNetwork });

  for (const output in ordinalPreTx.outs) {
    try {
      ordinalPreTx.setWitness(parseInt(output), []);
    } catch (e: any) {}
  }
  const pubKey = await window.metaidwallet.btc.getPublicKey();
  const psbtInput = {
    hash: ordinalUtxo.txId,
    index: ordinalUtxo.outputIndex,
    witnessUtxo: ordinalPreTx.outs[ordinalUtxo.outputIndex],
    sighashType: SIGHASH_SINGLE_ANYONECANPAY,
  };
  const addressType = determineAddressInfo(btcAddress).toUpperCase();
  
  const input = fillInternalKey(psbtInput, btcAddress, pubKey);
  if (["P2PKH"].includes(addressType)) {
    delete psbtInput.witnessUtxo;
    psbtInput["nonWitnessUtxo"] = ordinalPreTx.toBuffer();
  }
  ask.addInput(input);

  // Step 2: Build output as what the seller want (BTC)
  ask.addOutput({
    address: btcAddress,
    value: safeOutputValue(total),
  });

  const signed = await window.metaidwallet.btc.signPsbt({
    psbtHex: ask.toHex(),
    
  });
  if (typeof signed === "object") {
    if (signed.status === "canceled") throw new Error("canceled");
    throw new Error("");
  }
  return signed;
}

export async function buildBuyTake({
  order,
  network,
  takePsbtRaw,
  feeRate,
}: {
  order: {
    orderId: string;
    feeAmount: number;
    price: number;
  };
  network: API.Network;
  takePsbtRaw: string;
  feeRate: number;
}) {
  const btcNetwork =
    network === "mainnet" ? networks.bitcoin : networks.testnet;

  // 1. get buy essentials and construct buy psbt

  const buy = Psbt.fromHex(takePsbtRaw, {
    network: btcNetwork,
  });
  console.log("🚀 ~ file: order-builder.ts:293 ~ askPsbt:", buy);

  // 2. add service fee
  // 🚓🚓 UPDATE: Since now the transaction structure is controlled by backend, we dont' have to add service fees outputs on our own

  // 3. pay for the order / service fees and gas and change
  const { fee } = await exclusiveChange({
    psbt: buy,
    maxUtxosCount: USE_UTXO_COUNT_LIMIT,
    sighashType: SIGHASH_ALL,
    feeb: feeRate,
    network,
  });
  const totalSpent = order.feeAmount + order.price + fee;

  return {
    order: buy,
    totalSpent,
  };
}

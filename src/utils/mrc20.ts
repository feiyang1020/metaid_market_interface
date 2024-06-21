import {
  networks,
  Psbt,
  address as addressLib,
  initEccLib,
} from "bitcoinjs-lib";
import { buildTx, createPsbtInput, fillInternalKey } from "./psbtBuild";
import Decimal from "decimal.js";
import mempoolJS from "@mempool/mempool.js";
import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";
import { determineAddressInfo } from "./utlis";
import {
  SIGHASH_ALL,
  SIGHASH_ALL_ANYONECANPAY,
  SIGHASH_SINGLE_ANYONECANPAY,
} from "./orders";
const DUST_SIZE = 546;
type CommitPsbtParams = {
  addressType: string;
  address: string;
  publicKey: Buffer;
  script: Buffer;
  network: API.Network;
} & API.MintMRC20PreRes;

const _commitMint = async (
  params: CommitPsbtParams,
  selectedUTXOs: API.UTXO[],
  change: Decimal,
  needChange: boolean
) => {
  const {
    address,
    network,
    revealAddress,
    revealFee,
    addressType,
    publicKey,
    script,
    serviceFee,
    serviceAddress,
  } = params;
  const btcNetwork =
    network === "mainnet" ? networks.bitcoin : networks.testnet;
  const psbt = new Psbt({ network: btcNetwork });
  for (const utxo of selectedUTXOs) {
    const psbtInput = await createPsbtInput({
      utxo: utxo,
      addressType,
      publicKey,
      script,
    });
    psbt.addInput(psbtInput);
  }
  psbt.addOutput({
    address: revealAddress,
    value: revealFee,
  });
  if (serviceFee > 0) {
    psbt.addOutput({
      address: serviceAddress,
      value: serviceFee,
    });
  }
  if (needChange || change.gt(DUST_SIZE)) {
    psbt.addOutput({
      address: address,
      value: change.toNumber(),
    });
  }
  const _signPsbt = await window.metaidwallet.btc.signPsbt({
    psbtHex: psbt.toHex(),
    options: {
      autoFinalized: true,
    },
  });
  if (typeof _signPsbt === "object") {
    if (_signPsbt.status === "canceled") throw new Error("canceled");
    throw new Error("");
  }
  const signPsbt = Psbt.fromHex(_signPsbt);
  return signPsbt;
};
export const commitMintMRC20PSBT = async (
  order: API.MintMRC20PreRes,
  feeRate: number,
  address: string,
  network: API.Network
) => {
  initEccLib(ecc);
  const { totalFee, revealInputIndex } = order;
  const utxos = (await window.metaidwallet.btc.getUtxos()).sort(
    (a, b) => b.satoshi - a.satoshi
  );
  const addressType = determineAddressInfo(address).toUpperCase();
  const publicKey = await window.metaidwallet.btc.getPublicKey();
  const btcNetwork =
    network === "mainnet" ? networks.bitcoin : networks.testnet;
  const script = addressLib.toOutputScript(address, btcNetwork);
  const commitTx = await buildTx<CommitPsbtParams>(
    utxos,
    new Decimal(totalFee),
    feeRate,
    {
      addressType,
      address,
      publicKey: Buffer.from(publicKey, "hex"),
      script,
      network,
      ...order,
    },
    address,
    _commitMint
  );
  const { rawTx, txId, psbt: commitPsbt } = commitTx;
  const psbt = Psbt.fromHex(order.revealPrePsbtRaw, {
    network: btcNetwork,
  });

  psbt.data.globalMap.unsignedTx.tx.ins[revealInputIndex].hash = Buffer.from(
    txId,
    "hex"
  ).reverse();
  psbt.data.globalMap.unsignedTx.tx.ins[revealInputIndex].index = 0;
  const toSignInputs = [];
  for (let i = 0; i < revealInputIndex; i++) {
    toSignInputs.push({
      index: 0,
      address: address,
      sighashTypes: [SIGHASH_ALL],
    });
  }
  const revealPrePsbtRaw = await window.metaidwallet.btc.signPsbt({
    psbtHex: psbt.toHex(),
    options: {
      toSignInputs,
      autoFinalized: false,
    },
  });

  if (typeof revealPrePsbtRaw === "object") {
    throw new Error("canceled");
  }
  return { rawTx, revealPrePsbtRaw };
};

export const transferMRC20PSBT = async (
  order: API.TransferMRC20PreRes,
  feeRate: number,
  address: string,
  network: API.Network
) => {
  return commitMintMRC20PSBT(order, feeRate, address, network);
};

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
import { SIGHASH_ALL } from "./orders";
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
  network: API.Network,
  pinUxtoTxId: string
) => {
  initEccLib(ecc);
  const { totalFee } = order;
  const utxos = (await window.metaidwallet.btc.getUtxos()).sort(
    (a, b) => b.satoshi - a.satoshi
  );
  console.log(utxos, "utxos in buildTicketPsbt");
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
  const { rawTx, txId } = commitTx;
  const psbt = Psbt.fromHex(order.revealPrePsbtRaw, {
    network: btcNetwork,
  });
  const psbt2 = new Psbt({ network: btcNetwork });
  for (let i = 0; i < psbt.txInputs.length; i++) {
    const txInput = psbt.txInputs[i];
    psbt2.addInput({
      hash: i === 1 ? Buffer.from(txId, "hex") : txInput.hash,
      index: txInput.index,
      sequence: txInput.sequence,
      witnessUtxo: psbt.data.inputs[i].witnessUtxo,
      sighashType: psbt.data.inputs[i].sighashType,
    });
  }
  for (const txOutput of psbt.txOutputs) {
    psbt2.addOutput(txOutput);
  }
  psbt2.updateInput(
    0,
    await fillInternalKey({
      publicKey: Buffer.from(publicKey, "hex"),
      addressType,
      txId: pinUxtoTxId,
    })
  );

  console.log(psbt2, psbt2.txInputs[1].hash, txId, "psbt after update");

  const toSignInputs = [
    {
      index: 0,
      address: address,
      sighashTypes: [SIGHASH_ALL],
    },
  ];
  const revealPrePsbtRaw = await window.metaidwallet.btc.signPsbt({
    psbtHex: psbt2.toHex(),
    options: {
      toSignInputs,
      autoFinalized: true,
    },
  });
  if (typeof revealPrePsbtRaw === "object") {
    throw new Error("canceled");
  }
  return { rawTx, revealPrePsbtRaw };
};

export const mintRevealPrePsbtRaw = async (
  order: API.MintMRC20PreRes,
  feeRate: number,
  address: string,
  network: API.Network,
  txId: string,
  pinUxtoTxId: string
) => {
  initEccLib(ecc);

  const psbt = Psbt.fromHex(order.revealPrePsbtRaw, {
    network: network === "mainnet" ? networks.bitcoin : networks.testnet,
  });
  const addressType = determineAddressInfo(address).toUpperCase();
  const publicKey = await window.metaidwallet.btc.getPublicKey();
  console.log(psbt, "psbt");
  psbt.updateInput(
    0,
    await fillInternalKey({
      publicKey: Buffer.from(publicKey, "hex"),
      addressType,
      txId: pinUxtoTxId,
    })
  );
  psbt.txInputs[1].hash = Buffer.from(txId, "hex");
  psbt.updateInput(1, { hash: txId, index: 1 });
  console.log(psbt, psbt.txInputs[1].hash, txId, "psbt after update");

  const toSignInputs = [
    {
      index: 0,
      address: address,
      sighashTypes: [SIGHASH_ALL],
    },
  ];
  const revealPrePsbtRaw = await window.metaidwallet.btc.signPsbt({
    psbtHex: psbt.toHex(),
    options: {
      toSignInputs,
      autoFinalized: true,
    },
  });
  if (typeof revealPrePsbtRaw === "object") {
    throw new Error("canceled");
  }
  return revealPrePsbtRaw;
};

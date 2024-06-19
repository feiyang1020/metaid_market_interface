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
import { SIGHASH_ALL, SIGHASH_ALL_ANYONECANPAY, SIGHASH_SINGLE_ANYONECANPAY } from "./orders";
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

  const test = Psbt.fromHex(
    "70736274ff01009a0200000002894873767db93a9fca981076dcaad7df528cb2351fc504b4603f48ca4cdeade80000000000ffffffff5cf41fd17ce93442228dd8ef51703c7a0fe74e59bf236eb01c73e4a5bb6050e20100000000ffffffff0222020000000000001600142153b6c9d77d1596de652cb45a7225305271a6f222020000000000001600142153b6c9d77d1596de652cb45a7225305271a6f2000000000001011f22020000000000001600142153b6c9d77d1596de652cb45a7225305271a6f201086c024830450221008f6d866174f46f3864f2b28ef101650079bdac4c0d92c16ae9ff49f9b431318a02202dc64e17646e1a74a10b68c84ba4640101df24884e9e13bc2c70437c5f8b906b012103699cfa8eeae59ef3e607e1e4d90efe9156110bb21234cff6bbd9fe47afcc40e10001012b28e1000000000000225120000339c6a40e259e56ca1296f4093f3a18ef8a7a77c0dbbaddf8c8c4b5ae026e01030401000000000000"
  );
  console.log(test.txInputs, "test");
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
  const { rawTx, txId, psbt: commitPsbt } = commitTx;
  const psbt = Psbt.fromHex(order.revealPrePsbtRaw, {
    network: btcNetwork,
  });

  psbt.data.globalMap.unsignedTx.tx.ins[1].hash= Buffer.from(txId, "hex").reverse();
  psbt.data.globalMap.unsignedTx.tx.ins[1].index= 0;
  console.log(
    commitPsbt.extractTransaction().getHash(),
    commitPsbt.extractTransaction().getHash(true),
    txId,
    Buffer.from(txId, "hex").reverse(),
    psbt,
    "psbt.txInputs"
  );
  // const psbt2 = new Psbt({ network: btcNetwork });
  // console.log(psbt.data.inputs, "txInput");
  // for (let i = 0; i < psbt.txInputs.length; i++) {
  //   const txInput = psbt.txInputs[i];
  //   console.log(psbt.data.inputs[i].witnessUtxo, "txInput");
  //   const input: any = {
  //     hash: i === 1 ? txId : txInput.hash,
  //     index: txInput.index,
  //     sequence: txInput.sequence,
  //     sighashType: psbt.data.inputs[i].sighashType,
  //   };
  //   if (psbt.data.inputs[i].witnessUtxo) {
  //     input["witnessUtxo"] = psbt.data.inputs[i].witnessUtxo;
  //   }
  //   if (psbt.data.inputs[i].nonWitnessUtxo) {
  //     input["nonWitnessUtxo"] = psbt.data.inputs[i].nonWitnessUtxo;
  //   }
  //   psbt2.addInput(input);
  // }
  // for (const txOutput of psbt.txOutputs) {
  //   psbt2.addOutput(txOutput);
  // }
  // psbt2.updateInput(
  //   0,
  //   await fillInternalKey({
  //     publicKey: Buffer.from(publicKey, "hex"),
  //     addressType,
  //     txId: pinUxtoTxId,
  //   })
  // );

  // console.log(psbt2, psbt2.txInputs[1].hash, txId, "psbt after update");

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
      autoFinalized: false,
    },
  });

  if (typeof revealPrePsbtRaw === "object") {
    throw new Error("canceled");
  }
  // console.log(order.revealPrePsbtRaw, "order.revealPrePsbtRaw");
  // console.log(revealPrePsbtRaw, "revealPrePsbtRaw");
  // const test2 = Psbt.fromHex(revealPrePsbtRaw);
  // console.log(test2.txInputs, "test2");
  return { rawTx, revealPrePsbtRaw };
};

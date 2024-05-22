import { getRawTx } from "@/services/api";
import { Psbt, Transaction, networks } from "bitcoinjs-lib";
import { Decimal } from "decimal.js";
export const DUST_SIZE = 546;
export const SIGHASH_ALL = 0x01;
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
    throw new Error("Insufficient funds to reach the target amount");
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

function getWitnessUtxo(out: any): any {
  delete out.address;
  out.script = Buffer.from(out.script, "hex");
  return out;
}

export async function createPsbtInput({
  utxo,
  addressType,
  network,
}: {
  utxo: API.UTXO;
  network: API.Network;
  addressType: string;
}) {
  const payInput: any = {
    hash: utxo.txId,
    index: utxo.vout || utxo.outputIndex,
  };
  const {
    data: { rawTx },
  } = await getRawTx(network, { txid: utxo.txId });
  const tx = Transaction.fromHex(rawTx);

  if (["P2WPKH"].includes(addressType)) {
    payInput["witnessUtxo"] = getWitnessUtxo(
      tx.outs[utxo.vout || utxo.outputIndex]
    );
  }
  if (["P2PKH"].includes(addressType)) {
    payInput["nonWitnessUtxo"] = tx.toBuffer();
  }
  return payInput;
}

async function buildBuyPsbt(
  net: API.Network,
  psbtRaw: string,
  selectedUTXOs: API.UTXO[],
  addressType: string,
  seller: string,
  sellPriceAmount: Decimal,
  change: Decimal,
  needChange: boolean,
  senderAddress: string
) {
  const btcNetwork = net === "mainnet" ? networks.bitcoin : networks.testnet;
  const psbt = Psbt.fromHex(psbtRaw, { network: btcNetwork });
  let inputCount = psbt.inputCount;
  console.log(psbt, inputCount);
  const toSignInputs = [];

  for (const utxo of selectedUTXOs) {
    const psbtInput = await createPsbtInput({
      utxo: utxo,
      network: net,
      addressType,
    });
    psbt.addInput(psbtInput);

    toSignInputs.push({
      index: inputCount,
      address: senderAddress,
      sighashTypes: [SIGHASH_ALL],
    });
    inputCount += 1;
  }
  psbt.addOutput({
    address: seller,
    value: sellPriceAmount.toNumber(),
  });
  if (needChange || change.gt(DUST_SIZE)) {
    psbt.addOutput({
      address: senderAddress,
      value: change.toNumber(),
    });
  }
  console.log(toSignInputs);
  const _signPsbt = await window.metaidwallet.btc.signPsbt({
    psbtHex: psbt.toHex(),
    options: {
      autoFinalized: false,
      toSignInputs,
    },
  });
  console.log(_signPsbt);
  if (typeof _signPsbt === "object") {
    if (_signPsbt.status === "canceled") throw new Error("canceled");
    throw new Error("");
  }
  const signPsbt = Psbt.fromHex(_signPsbt);
  console.log(signPsbt);
  return signPsbt;
}

export async function buyOrder(
  psbtRaw: string,
  net: API.Network,
  seller: string,
  sellPriceAmount: number,
  addressType: string,
  feeRate: number
) {
  const amount = new Decimal(sellPriceAmount);
  const senderAddress = await window.metaidwallet.btc.getAddress();
  const utxos = await window.metaidwallet.btc.getUtxos();
  let selectedUTXOs = selectUTXOs(utxos, amount);
  let total = getTotalSatoshi(selectedUTXOs);
  let psbt = await buildBuyPsbt(
    net,
    psbtRaw,
    selectedUTXOs,
    addressType,
    seller,
    amount,
    total.minus(amount),
    true,
    senderAddress
  );
  let estimatedFee = calculateEstimatedFee(psbt, feeRate);
  while (total.lt(amount.add(estimatedFee))) {
    if (selectedUTXOs.length === utxos.length) {
      throw new Error("Insufficient funds");
    }
    selectedUTXOs = selectUTXOs(utxos, amount.add(estimatedFee));
    total = getTotalSatoshi(selectedUTXOs);
    psbt = await buildBuyPsbt(
      net,
      psbtRaw,
      selectedUTXOs,
      addressType,
      seller,
      amount,
      total.minus(amount.add(estimatedFee)),
      true,
      senderAddress
    );
    estimatedFee = calculateEstimatedFee(psbt, feeRate);
  }

  psbt = await buildBuyPsbt(
    net,
    psbtRaw,
    selectedUTXOs,
    addressType,
    seller,
    amount,
    total.minus(amount.add(estimatedFee)),
    true,
    senderAddress
  );

  return {
    psbt,
    fee: total
      .minus(psbt.txOutputs.reduce((acc, cur) => acc + Number(cur.value), 0))
      .toString(),
    txId: psbt.extractTransaction().getId(),
    rawTx: psbt.extractTransaction().toHex(),
  };
}

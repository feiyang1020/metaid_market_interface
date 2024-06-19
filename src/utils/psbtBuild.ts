import { Decimal } from 'decimal.js'
import {
  Psbt,
  Transaction,
  address as libAddress,
  payments,
  networks,
} from 'bitcoinjs-lib'
import mempoolJS from '@mempool/mempool.js'
import { isTaprootInput } from 'bitcoinjs-lib/src/psbt/bip371'
import { toXOnly } from './orders'

const TX_EMPTY_SIZE = 4 + 1 + 1 + 4
const TX_INPUT_BASE = 32 + 4 + 1 + 4 // 41
const TX_INPUT_PUBKEYHASH = 107
const TX_INPUT_SEGWIT = 27
const TX_INPUT_TAPROOT = 17 // round up 16.5 bytes
const TX_OUTPUT_BASE = 8 + 1
const TX_OUTPUT_PUBKEYHASH = 25
const TX_OUTPUT_SCRIPTHASH = 23
const TX_OUTPUT_SEGWIT = 22
const TX_OUTPUT_SEGWIT_SCRIPTHASH = 34
const TX_INPUT_SCRIPT_BASE = 0

function selectUTXOs(utxos: API.UTXO[], targetAmount: Decimal) {
  let totalAmount = new Decimal(0)
  const selectedUtxos: typeof utxos = []
  for (const utxo of utxos) {
    selectedUtxos.push(utxo)
    totalAmount = totalAmount.add(utxo.satoshis)

    if (totalAmount.gte(targetAmount)) {
      break
    }
  }

  if (totalAmount.lt(targetAmount)) {
    throw new Error('Insufficient funds to reach the target amount')
  }

  return selectedUtxos
}

function getTotalSatoshi(utxos: API.UTXO[]) {
  return utxos.reduce((total, utxo) => total.add(utxo.satoshis), new Decimal(0))
}
function calculateEstimatedFee(psbt: Psbt, feeRate: number) {
  const tx = psbt.extractTransaction()
  const size = tx.virtualSize()
  return new Decimal(size).mul(feeRate)
}
type PsbtInput = (typeof Psbt.prototype.data.inputs)[0]
export interface TransactionOutput {
  script: Buffer
  value: number
}
export interface PsbtTxOutput extends TransactionOutput {
  address: string | undefined
}

function inputBytes(input: PsbtInput) {
  // todo: script length

  if (isTaprootInput(input)) {
    return TX_INPUT_BASE + TX_INPUT_TAPROOT
  }
  if (input.redeemScript)
    return TX_INPUT_BASE  + input.redeemScript.length
  if (input.nonWitnessUtxo) return TX_INPUT_BASE + TX_INPUT_PUBKEYHASH
  if (input.witnessUtxo) return TX_INPUT_BASE + TX_INPUT_SEGWIT

  return TX_INPUT_BASE + TX_INPUT_PUBKEYHASH
}

function outputBytes(output: PsbtTxOutput) {
  // if output is op-return, use it's buffer size

  return (
    TX_OUTPUT_BASE +
    (output.script
      ? output.script.length
      : output.address?.startsWith('bc1') || output.address?.startsWith('tb1')
        ? output.address?.length === 42 // TODO: looks like something wrong here
          ? TX_OUTPUT_SEGWIT
          : TX_OUTPUT_SEGWIT_SCRIPTHASH
        : output.address?.startsWith('3') || output.address?.startsWith('2')
          ? TX_OUTPUT_SCRIPTHASH
          : TX_OUTPUT_PUBKEYHASH)
  )
}
function transactionBytes(inputs: PsbtInput[], outputs: PsbtTxOutput[]) {
  const inputsSize = inputs.reduce(function (a, x) {
    return a + inputBytes(x)
  }, 0)
  const outputsSize = outputs.reduce(function (a, x, index) {
    return a + outputBytes(x)
  }, 0)

  console.log({
    inputsSize,
    outputsSize,
    TX_EMPTY_SIZE,
  })
  return TX_EMPTY_SIZE + inputsSize + outputsSize
}

export function calcFee(psbt: Psbt, feeRate: number) {
  const inputs = psbt.data.inputs
  const outputs = psbt.txOutputs

  const bytes = transactionBytes(inputs, outputs)
  console.log({ bytes })
  return new Decimal(bytes).mul(feeRate)
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
  ) => Promise<Psbt>,
  manualCalcFee: boolean = false,
): Promise<{
  psbt: Psbt
  fee: string
  txId: string
  rawTx: string
  txInputs: API.Tx[]
  txOutputs: API.Tx[]
}> {
  let selectedUTXOs = selectUTXOs(utxos, amount)
  let total = getTotalSatoshi(selectedUTXOs)
  let psbt = await buildPsbt(
    buildPsbtParams,
    selectedUTXOs,
    total.minus(amount),
    true,
  )
  let estimatedFee = manualCalcFee
    ? calcFee(psbt, feeRate)
    : calculateEstimatedFee(psbt, feeRate)
  while (total.lt(amount.add(estimatedFee))) {
    if (selectedUTXOs.length === utxos.length) {
      throw new Error('Insufficient funds')
    }
    selectedUTXOs = selectUTXOs(utxos, amount.add(estimatedFee))
    total = getTotalSatoshi(selectedUTXOs)
    psbt = await buildPsbt(
      buildPsbtParams,
      selectedUTXOs,
      total.minus(amount.add(estimatedFee)),
      true,
    )
    estimatedFee = manualCalcFee
      ? calcFee(psbt, feeRate)
      : calculateEstimatedFee(psbt, feeRate)
  }

  psbt = await buildPsbt(
    buildPsbtParams,
    selectedUTXOs,
    total.minus(amount.add(estimatedFee)),
    false,
  )
  return {
    psbt,
    fee: total
      .minus(psbt.txOutputs.reduce((acc, cur) => acc + Number(cur.value), 0))
      .toString(),
    txId: manualCalcFee ? '' : psbt.extractTransaction().getId(),
    rawTx: manualCalcFee ? psbt.toHex() : psbt.extractTransaction().toHex(),
    txInputs: selectedUTXOs.map((utxo) => ({
      address,
      value: utxo.satoshis,
    })),
    txOutputs: psbt.txOutputs.map((out) => ({
      address: out.address || '',
      value: out.value,
    })),
  }
}

export async function createPsbtInput({
  utxo,
  addressType,
  publicKey,
  script,
}: {
  utxo: API.UTXO
  publicKey: Buffer
  script: Buffer
  addressType: string
}) {
  const payInput: any = {
    hash: utxo.txId,
    index: utxo.vout,

    sequence: 0xffffffff, // These are defaults. This line is not needed.
  }
  if (['P2TR'].includes(addressType)) {
    console.log('input.tapInternalKey',publicKey.subarray(1))
    const tapInternalKey = toXOnly(publicKey);
    
    payInput['tapInternalKey'] = tapInternalKey
    payInput['witnessUtxo'] = { value: utxo.satoshi, script }
  }
  if (['P2WPKH'].includes(addressType)) {
    payInput['witnessUtxo'] = { value: utxo.satoshi, script }
  }
  if (['P2PKH'].includes(addressType)) {
    const mempoolReturn = mempoolJS({
      hostname: 'mempool.space',
      network: 'testnet',
    })
    const rawTx = await mempoolReturn.bitcoin.transactions.getTxHex({
      txid: utxo.txId,
    })
    const tx = Transaction.fromHex(rawTx)
    payInput['nonWitnessUtxo'] = tx.toBuffer()
  }
  if (['P2SH'].includes(addressType)) {
    console.log('input.tapInternalKey')
    const { redeem } = payments.p2sh({
      redeem: payments.p2wpkh({
        pubkey: publicKey,
        network: networks.testnet,
      }),
      network: networks.testnet,
    })
    if (!redeem) throw new Error('redeemScript')
    payInput.redeemScript = redeem.output
    payInput['witnessUtxo'] = { value: utxo.satoshi, script }
  }
  return payInput
}

export async function fillInternalKey({
  publicKey,
  addressType,
  txId
}: {
  publicKey: Buffer
  addressType: string
  txId?:string
}) {
  const payInput: any = {}
  if (['P2TR'].includes(addressType)) {
    const tapInternalKey = toXOnly(publicKey);
    payInput['tapInternalKey'] = tapInternalKey
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
  
  if (['P2SH'].includes(addressType)) {
    console.log('input.tapInternalKey')
    const { redeem } = payments.p2sh({
      redeem: payments.p2wpkh({
        pubkey: publicKey,
        network: networks.testnet,
      }),
      network: networks.testnet,
    })
    if (!redeem) throw new Error('redeemScript')
    payInput.redeemScript = redeem.output
  }
  return payInput
}

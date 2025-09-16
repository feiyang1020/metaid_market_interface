import { TxComposer, mvc } from "meta-contract";
import { isNil } from 'lodash'
import axios from "axios";
export type Transaction = {
  txComposer: TxComposer;
  message: string;
};
export interface InscribeResultForYesBroadcast {
  commitTxId: string;
  revealTxIds: string[];
  commitCost: string;
  revealCost: string;
  status?: string;
}
export interface InscribeResultForNoBroadcast {
  commitTxHex: string;
  revealTxsHex: string[];
  commitCost: string;
  revealCost: string;
  status?: string;
}
export interface InscribeResultForIfBroadcasting {
  no: InscribeResultForYesBroadcast;
  yes: InscribeResultForNoBroadcast;
}
export type Operation = "init" | "create" | "modify" | "revoke";
export type Encryption = "0" | "1" | "2";
export type BtcNetwork = "mainnet" | "testnet" | "regtest";
export type MetaidData = {
  operation?: Operation;
  body?: string | Buffer;
  path?: string;
  contentType?: string;
  encryption?: "0" | "1" | "2";
  version?: string;
  encoding?: BufferEncoding;
  revealAddr?: string;
  flag?: "metaid";
  outputs?: {
    address: string;
    value: number;
  }[];
};
export type InscribeData = Omit<MetaidData, "revealAddr">;
export type InscriptionRequest = {
  // commitTxPrevOutputList: PrevOutput[]
  feeRate: number;
  metaidDataList: MetaidData[];
  revealOutValue: number;
  changeAddress: string;
  minChangeValue?: number;
  service?: {
    address: string;
    satoshis: string;
  };
  outputs?: {
    address: string;
    satoshis: string;
  }[];
};

export function getEffectiveBTCFeerate(feeRate: number): number {
  return feeRate === 1 ? 1.1 : feeRate;
}
export async function createPinWithBtc<
  T extends keyof InscribeResultForIfBroadcasting,
>({
  inscribeDataArray,
  options,
}: {
  inscribeDataArray: InscribeData[];
  options: {
    noBroadcast: T;
    feeRate?: number;
    network?: "mainnet" | "testnet" | "regtest";
    service?: {
      address: string;
      satoshis: string;
    };
    outputs?: {
      address: string;
      satoshis: string;
    }[];
  };
}): Promise<InscribeResultForIfBroadcasting[T]> {
  const address = await window.metaidwallet.btc.getAddress();

  const metaidDataList: MetaidData[] = inscribeDataArray.map((inp) => {
    const contentType = inp?.contentType ?? "text/plain";
    const encoding = inp?.encoding ?? "utf-8";
    return {
      operation: inp.operation,
      revealAddr: address,
      body: inp?.body,
      path: inp?.path,
      contentType: contentType,
      encryption: inp?.encryption,
      flag: inp?.flag,
      version: "1.0.0",
      encoding,
      outputs: inp.outputs || [],
    };
  });

  const request: InscriptionRequest = {
    // commitTxPrevOutputList,
    feeRate: getEffectiveBTCFeerate(options?.feeRate ?? 1),
    revealOutValue: 546,
    metaidDataList,
    changeAddress: address,
    service: options?.service,
    outputs: options?.outputs,
  };

  const data = {
    data: request,
    options: {
      noBroadcast: options?.noBroadcast !== "no",
    },
  };

  console.log("data", JSON.stringify(data));

  const res = await window.metaidwallet.btc.inscribe({
    data: request,
    options: {
      noBroadcast: options?.noBroadcast !== "no",
    },
  });

  console.log("inscrible res", res);

  return res;
}

export type CreatePinResult =
  | {
      transactions: Transaction[];
      txid?: undefined;
      txids?: string[];
    }
  | {
      txid: string;
      transactions?: undefined;
      txids?: string[];
    };

type OpReturnV2 = [
  "metaid", // metaid for Testnet, metaid for Mainnet
  Operation,
  string | undefined, // path example: /protocols/simplebuzz
  Encryption | undefined,
  string | undefined, // version
  string | undefined, // contentType,
  string | Buffer | undefined,
];
export function buildOpReturnV2(
  metaidData: Omit<MetaidData, "revealAddr">,
  options?: { network: BtcNetwork }
): OpReturnV2 {
  const res1 = ["metaid", metaidData.operation];
  const res2 = [];
  if (metaidData.operation !== "init") {
    res2.push(metaidData.path!);
    res2.push(metaidData?.encryption ?? "0");
    res2.push(metaidData?.version ?? "1.0.0");
    res2.push(metaidData?.contentType ?? "text/plain;utf-8");

    const body = isNil(metaidData.body)
      ? undefined
      : Buffer.isBuffer(metaidData.body)
        ? metaidData.body
        : Buffer.from(metaidData.body, metaidData?.encoding ?? "utf-8");
    res2.push(body);
    // const maxChunkSize = 520
    // const bodySize = (body as Buffer).length
    // for (let i = 0; i < bodySize; i += maxChunkSize) {
    //   let end = i + maxChunkSize
    //   if (end > bodySize) {
    //     end = bodySize
    //   }
    //   res.push((body as Buffer).slice(i, end))
    // }
  }
  return [...res1, ...res2] as OpReturnV2;
}

const pay = async ({
  transactions,
  feeb,
}: {
  transactions: Transaction[]
  feeb: number | undefined
}) => {
  const params = {
    transactions: transactions.map(transaction => {
      return {
        txComposer: transaction.txComposer.serialize(),
        message: transaction.message,
      }
    }),
    hasMetaid: true,
    feeb,
  }


  const ret = await window.metaidwallet.pay(params)

  const {
    payedTransactions,
    status,
    message,
  }: {
    payedTransactions: string[]
    status: string
    message: string
  } = ret

  if (status) {
    throw new Error(message || status)
  }

  return payedTransactions.map((txComposerSerialized: string) => {
    return TxComposer.deserialize(txComposerSerialized)
  })
}

export async function broadcastToApi({
  txHex,
  network,
  chain = 'mvc',
}: {
  txHex: string
  network: BtcNetwork
  chain?: 'mvc' | 'btc'
}): Promise<{ txid: string }> {
  const { data: txid, message } = await axios
    .post('https://www.metalet.space/wallet-api/v3/tx/broadcast', {
      chain: chain,
      net: network,
      rawTx: txHex,
    })
    .then(res => res.data)
  if (!txid) {
    throw new Error(message)
  }

  return { txid }
}

const broadcast = async ({
  txComposer,
  network,
}: {
  txComposer: TxComposer
  network: BtcNetwork
}): Promise<{ txid: string }> => {
  // broadcast locally first
  const txHex = txComposer.getTx().toString()

  const { txid } = await broadcastToApi({ txHex, network })
  console.log('txid', txid)

  return { txid }
}

const batchBroadcast = async ({
  txComposer,
  network,
}: {
  txComposer: TxComposer[]
  network: BtcNetwork
}): Promise<{ txid: string }[]> => {
  const res: { txid: string }[] = []
  for (let i = 0; i < txComposer.length; i++) {
    const broadcastRes = await broadcast({
      txComposer: txComposer[i],
      network,
    })
    res.push(broadcastRes)
  }

  return res
}

export const createPin = async (
  metaidData: Omit<MetaidData, "revealAddr">,
  options: {
    signMessage?: string;
    serialAction?: "combo" | "finish";
    transactions?: Transaction[];
    network: BtcNetwork;
    service?: {
      address: string;
      satoshis: string;
    };
    outputs?: {
      address: string;
      satoshis: string;
    }[];
    feeRate?: number;
  }
): Promise<CreatePinResult> => {
  const transactions: Transaction[] = options?.transactions ?? [];
  const address = await window.metaidwallet.getAddress();
  // if (!(await checkBalance({ address: this.wallet.address, network: options?.network ?? 'testnet' }))) {
  //   throw new Error(errors.NOT_ENOUGH_BALANCE)
  // }

  const pinTxComposer = new TxComposer();

  pinTxComposer.appendP2PKHOutput({
    address: new mvc.Address(address, options.network),
    satoshis: 1,
  });

  const metaidOpreturn = buildOpReturnV2(metaidData, {
    network: options?.network ?? "testnet",
  });

  pinTxComposer.appendOpReturnOutput(metaidOpreturn);

  if (
    options?.service &&
    options?.service.address &&
    options?.service.satoshis
  ) {
    pinTxComposer.appendP2PKHOutput({
      address: new mvc.Address(options.service.address, options.network),
      satoshis: Number(options.service.satoshis),
    });
  }

  if (options?.outputs) {
    for (const output of options.outputs) {
      pinTxComposer.appendP2PKHOutput({
        address: new mvc.Address(output.address, options.network),
        satoshis: Number(output.satoshis),
      });
    }
  }

  transactions.push({
    txComposer: pinTxComposer,
    message: "Create Pin",
  });

  if (options?.serialAction === "combo") {
    return { transactions };
  }

  /// // apply pay
  const payRes = await pay({
    transactions,
    feeb: options?.feeRate,
  });

  // for (const txComposer of payRes) {
  //   await this.connector.broadcast(txComposer)
  // }
  await batchBroadcast({ txComposer: payRes, network: options.network });

  return {
    txid: payRes[payRes.length - 1].getTxId(),
    txids: payRes.map((item) => item.getTxId()),
  };
};

declare namespace API {
  type Network = "testnet" | "mainnet";
  type Order = {
    assetId: string;
    assetNumber: number;
    assetType: string;
    buyer: {
      avatar: string;
      name: string;
    };
    buyerAddress: "string";
    content: "string";
    detail: "string";
    fee: 0;
    feeRate: 0;
    orderId: "string";
    orderState: 1;
    outValue: 0;
    preview: "string";
    sellPriceAmount: 0;
    sellPriceCoin: "string";
    sellPriceDecimal: 0;
    seller: {
      avatar: "string";
      name: "string";
    };
    sellerAddress: "string";
    takePsbt: "string";
    utxoId: "string";
    info: {
      contentLength: 8872;
      contentTypeDetect: "image/jpeg";
      createAddress: "tb1ppkvfwnw67q4w8pt86l7wr3jkngsyymqucrn6vxak7zpntawm6n6qwz929l";
      encryption: "0";
      genesisHeight: 2815479;
      genesisTransaction: "c40f45989c8b856c8d2a55264410fe80e2ab083e5998227e72ecfe4212d21b7b";
      metaid: "61a61ef4a77c3a9e9df56d4946356a4562be6c0cfec1b1d1575dabce834f6c07";
      operation: "create";
      originalPath: "/info/avatar";
      outputValue: 546;
      path: "/info/avatar";
      pinId: "c40f45989c8b856c8d2a55264410fe80e2ab083e5998227e72ecfe4212d21b7bi0";
      pinNumber: 241;
      pop: "00000000000000000000414744640463645224350604423120243163610625751135332020373701650607700027655037672514010043015077050165311662043611213617662543775763056730135447264403";
      popLv: 3;
      popSummary: "00414744640463";
      timestamp: 1715777709;
      version: "1.0.0";
    };
    textContent: string;
  };
  interface ListRet<T> {
    data: {
      total: number;
      list: T[];
    };
    message: string;
    code: number;
  }

  interface Ret<T> {
    data: T;
    message: string;
    code: number;
  }
  type Tx = {
    address: string
    value: number
  }
  type UTXO = {
    txId: string;
    vout: number;
    outputIndex: number;
    satoshis: number;
    satoshi: number;
    confirmed: boolean;
    rawTx?: string;
    inscriptions?:
      | {
          id: string;
          num: number;
        }[]
      | null;
    runes?: RUNESItem[];
  };
  type Asset = {
    assetId: string;
    assetNumber: number;
    assetType: string;
    buyer: {
      avatar: string;
      name: string;
    };
    buyerAddress: "string";
    content: "string";
    detail: "string";
    fee: 0;
    feeRate: 0;
    orderId: "string";
    orderState: 1;
    outValue: 0;
    preview: "string";
    sellPriceAmount: 0;
    sellPriceCoin: "string";
    sellPriceDecimal: 0;
    seller: {
      avatar: "string";
      name: "string";
    };
    sellerAddress: "string";
    takePsbt: "string";
    utxoId: "string";
    info: {
      contentTypeDetect: string;
      popLv: number;
      pinPath: string;
    };
    textContent: string;
  };

  type MintMRC20PreReq = {
    mintPins: {
      address: string;
      pinId: string;
      pinUtxoOutValue: number;
      pinUxtoIndex: number;
      pinUxtoTxId: string;
      pkScript: string;
    }[];
    networkFeeRate: number;
    outAddress: string;
    outValue: number;
    tickerId: string;
  };

  type MintMRC20PreRes = {
    orderId: string;
    revealAddress: string;
    revealFee: number;
    revealInputIndex: number;
    revealPrePsbtRaw: string;
    serviceAddress: string;
    serviceFee: number;
    totalFee: number;
  };
}

import { request } from "umi";
import mempoolJS from "@mempool/mempool.js";
const getHost = (network: API.Network) => {
  if (network === "mainnet") return "https://api.metaid.market/api-market";
  if (network === "testnet")
    return "https://api.metaid.market/api-market-testnet";
};

export async function getOrders(
  network: API.Network,
  params: {
    assetType: string;
    orderState: number;
    address?: string;
    sortKey: string;
    sortType: number;
    cursor: number;
    size: number;
  },
  options?: { [key: string]: any }
) {
  return request<API.ListRet<API.Order>>(
    `${getHost(network)}/api/v1/market/orders`,
    {
      method: "GET",
      params,
      ...(options || {}),
    }
  );
}

export async function getAssets(
  network: API.Network,
  params: {
    assetType: string;
    address?: string;
    cursor: number;
    size: number;
  },
  options?: { [key: string]: any }
) {
  return request<API.ListRet<API.Asset>>(
    `${getHost(network)}/api/v1/market/address/assets`,
    {
      method: "GET",
      params,
      ...(options || {}),
    }
  );
}

export async function getOrder(
  network: API.Network,
  params: {
    orderId: string;
  },
  options?: { [key: string]: any }
) {
  return request<API.Ret<API.Order>>(
    `${getHost(network)}/api/v1/market/order/detail`,
    {
      method: "GET",
      params,
      ...(options || {}),
    }
  );
}

export async function getOrderPsbt(
  network: API.Network,
  params: {
    orderId: string;
    buyerAddress: string;
  },
  options?: { [key: string]: any }
) {
  return request<API.Ret<API.Order>>(
    `${getHost(network)}/api/v1/market/order/psbt`,
    {
      method: "GET",
      params,
      ...(options || {}),
    }
  );
}

export async function sellOrder(
  network: API.Network,
  params: {
    assetType: string;
    assetId: string;
    address: string;
    psbtRaw: string;
  },
  options?: { [key: string]: any }
) {
  return request<
    API.Ret<{
      orderId: string;
      assetType: "pins";
      assetId: string;
      orderState: 1;
    }>
  >(`${getHost(network)}/api/v1/market/order/push`, {
    method: "POST",
    data: params,
    ...(options || {}),
  });
}

export async function buyOrder(
  network: API.Network,
  params: {
    orderId: string;
    takerPsbtRaw: string;
    networkFeeRate: number;
  },
  options?: { [key: string]: any }
) {
  return request<
    API.Ret<{
      orderId: string;
      assetType: string;
      assetId: string;
      orderState: 3;
      txId: string;
    }>
  >(`${getHost(network)}/api/v1/market/order/take`, {
    method: "POST",
    data: params,
    ...(options || {}),
  });
}

export async function cancelOrder(
  network: API.Network,
  params: {
    orderId: string;
  },
  options?: { [key: string]: any }
) {
  return request<
    API.Ret<{
      orderId: "7818c13ce41b6f16184f3a84fe7269cbf7e128c1f299188f00e7613587328677";
      assetType: "pins";
      assetId: "fa387e936bd347b1f22a3d5f9989ae3b5d1a7726da00a4c5462a624387467014i0";
      orderState: 2;
    }>
  >(`${getHost(network)}/api/v1/market/order/cancel`, {
    method: "POST",
    data: params,
    ...(options || {}),
  });
}

export async function authTest(
  network: API.Network,
  params: {
    address: string;
  },
  options?: { [key: string]: any }
) {
  return request<
    API.Ret<{
      orderId: "7818c13ce41b6f16184f3a84fe7269cbf7e128c1f299188f00e7613587328677";
      assetType: "pins";
      assetId: "fa387e936bd347b1f22a3d5f9989ae3b5d1a7726da00a4c5462a624387467014i0";
      orderState: 2;
    }>
  >(`${getHost(network)}/api/v1/auth/test`, {
    method: "POST",
    data: params,
    ...(options || {}),
  });
}

export async function getContent(
  url: string,
  options?: { [key: string]: any }
) {
  return request<string>(url, {
    method: "GET",
    ...(options || {}),
  });
}

export async function getRawTx(
  network: API.Network,
  params: { txid: string },
  options?: { [key: string]: any }
) {
  const { txid } = params;
  const url = `https://www.orders.exchange/api-book/common/tx/raw`;
  return request<API.Ret<{ rawTx: string }>>(url, {
    method: "GET",
    params: { net: network, txId: txid },
    ...(options || {}),
  });
}

export async function mintMrc20Pre(
  network: API.Network,
  params: API.MintMRC20PreReq,
  options?: { [key: string]: any }
) {
  return request<API.Ret<API.MintMRC20PreRes>>(
    `${getHost(network)}/api/v1/inscribe/mrc20/mint/pre`,
    {
      method: "POST",
      data: params,
      ...(options || {}),
    }
  );
}

export async function mintMrc20Commit(
  network: API.Network,
  params: {
    orderId: string;
    commitTxRaw: string;
    commitTxOutIndex: number; //commit交易中RevealAddress的output索引
    revealPrePsbtRaw: string;
  },
  options?: { [key: string]: any }
) {
  return request<
    API.Ret<{
      orderId: string;
      commitTxId: string;
      revealTxId: string;
    }>
  >(`${getHost(network)}/api/v1/inscribe/mrc20/mint/commit`, {
    method: "POST",
    data: params,
    ...(options || {}),
  });
}

export async function transfertMrc20Pre(
  network: API.Network,
  params: API.TransferMRC20PreReq,
  options?: { [key: string]: any }
) {
  return request<API.Ret<API.TransferMRC20PreRes>>(
    `${getHost(network)}/api/v1/inscribe/mrc20/transfer/pre`,
    {
      method: "POST",
      data: params,
      ...(options || {}),
    }
  );
}

export async function transferMrc20Commit(
  network: API.Network,
  params: {
    orderId: string;
    commitTxRaw: string;
    commitTxOutIndex: number; //commit交易中RevealAddress的output索引
    revealPrePsbtRaw: string;
  },
  options?: { [key: string]: any }
) {
  return request<
    API.Ret<{
      orderId: string;
      commitTxId: string;
      revealTxId: string;
    }>
  >(`${getHost(network)}/api/v1/inscribe/mrc20/transfer/commit`, {
    method: "POST",
    data: params,
    ...(options || {}),
  });
}
export async function getMrc20Info(
  network: API.Network,
  params: {
    tickId?: string;
    tick?: string;
  },
  options?: { [key: string]: any }
) {
  return request<API.Ret<API.MRC20TickInfo>>(
    `${getHost(network)}/api/v1/common/mrc20/tick/info`,
    {
      method: "GET",
      params,
      ...(options || {}),
    }
  );
}

export async function getMrc20AddressShovel(
  network: API.Network,
  params: {
    address: string;
    tickId: string;
    cursor: number;
    size: number;
  },
  options?: { [key: string]: any }
) {
  return request<API.ListRet<API.MRC20Shovel>>(
    `${getHost(network)}/api/v1/common/mrc20/address/shovel`,
    {
      method: "GET",
      params,
      ...(options || {}),
    }
  );
}

export async function getMrc20AddressUtxo(
  network: API.Network,
  params: {
    address: string;
    tickId: string;
    cursor: number;
    size: number;
  },
  options?: { [key: string]: any }
) {
  return request<API.ListRet<API.Mrc20AddressUtxo>>(
    `${getHost(network)}/api/v1/common/mrc20/address/utxo`,
    {
      method: "GET",
      params,
      ...(options || {}),
    }
  );
}

export async function getMrc20List(
  network: API.Network,
  params: {
    cursor: number;
    size: number;
    completed?: boolean;
    searchTick?: string;
    sortType?: number;
    orderBy?: string; //pinnumber/totalminted/holders/txcount
  },
  options?: { [key: string]: any }
) {
  return request<API.ListRet<API.MRC20Info>>(
    `${getHost(network)}/api/v1/common/mrc20/tick/info-list`,
    {
      method: "GET",
      params,
      ...(options || {}),
    }
  );
}

export async function getUserMrc20List(
  network: API.Network,
  params: {
    address?: string;
    cursor: number;
    size: number;
  },
  options?: { [key: string]: any }
) {
  if (!params.address)
    return Promise.resolve({ code: 0, data: { list: [], total: 0 } });
  return request<API.ListRet<API.UserMrc20Asset>>(
    `${getHost(network)}/api/v1/common/mrc20/address/balance-list`,
    {
      method: "GET",
      params,
      ...(options || {}),
    }
  );
}

export async function sellMRC20Order(
  network: API.Network,
  params: {
    assetType: string;
    tickId: string;
    address: string;
    psbtRaw: string;
  },
  options?: { [key: string]: any }
) {
  return request<
    API.Ret<{
      orderId: string;
      assetType: "pins";
      tickId: string;
      orderState: 1;
    }>
  >(`${getHost(network)}/api/v1/market/mrc20/order/push`, {
    method: "POST",
    data: params,
    ...(options || {}),
  });
}

export async function getMrc20Orders(
  network: API.Network,
  params: {
    assetType: string;
    orderState: number; //1-create, 2-cancel, 3-finish
    tickId?: string;
    sortKey?: string; //priceAmount/timestamp/tokenPriceRate, default:timestamp
    sortType?: number; //1-asc, -1-desc, default:-1
    address?: string;
    cursor: number;
    size: number;
  },
  options?: { [key: string]: any }
) {
  return request<API.ListRet<API.Mrc20Order>>(
    `${getHost(network)}/api/v1/market/mrc20/orders`,
    {
      method: "GET",
      params,
      ...(options || {}),
    }
  );
}

export async function getMrc20OrderPsbt(
  network: API.Network,
  params: {
    orderId: string;
    buyerAddress: string;
  },
  options?: { [key: string]: any }
) {
  return request<API.Ret<API.BuyOrderPsbtRes>>(
    `${getHost(network)}/api/v1/market/mrc20/order/psbt`,
    {
      method: "GET",
      params,
      ...(options || {}),
    }
  );
}

export async function buyMrc20OrderTake(
  network: API.Network,
  params: {
    orderId: string;
    takerPsbtRaw: string;
    networkFeeRate: number;
  },
  options?: { [key: string]: any }
) {
  return request<
    API.Ret<{
      orderId: string;
      assetType: string;
      assetId: string;
      orderState: 3;
      txId: string;
    }>
  >(`${getHost(network)}/api/v1/market/mrc20/order/take`, {
    method: "POST",
    data: params,
    ...(options || {}),
  });
}

export async function cancelMRC20Order(
  network: API.Network,
  params: {
    orderId: string;
  },
  options?: { [key: string]: any }
) {
  return request<
    API.Ret<{
      orderId: "7818c13ce41b6f16184f3a84fe7269cbf7e128c1f299188f00e7613587328677";
      assetType: "pins";
      assetId: "fa387e936bd347b1f22a3d5f9989ae3b5d1a7726da00a4c5462a624387467014i0";
      orderState: 2;
    }>
  >(`${getHost(network)}/api/v1/market/mrc20/order/cancel`, {
    method: "POST",
    data: params,
    ...(options || {}),
  });
}

export async function broadcastTx(
  network: API.Network,
  params: {
    txHex: string;
  },
  options?: { [key: string]: any }
) {
  const {
    bitcoin: { transactions },
  } = mempoolJS({
    hostname: "mempool.space",
    network: network === "mainnet" ? "main" : "testnet",
  });
  const txid = await transactions.postTx({ txhex: params.txHex });
  return txid;
}

// export async function broadcastBTCTx(
//   network: API.Network,
//   rawTx: string
// ): Promise<string> {
//   return request<string>(
//     `https://www.orders.exchange/api-book/common/tx/broadcast`,
//     {
//       method: "POST",
//       data: {
//         chain: "btc",
//         net: network === "mainnet" ? "livenet" : "testnet",
//         rawTx,
//       },
//     }
//   );
// }

export async function broadcastBTCTx(
  network: API.Network,
  txHex: string,
  options?: { [key: string]: any }
) {
  return request<
    API.Ret<{
      txId: string;
    }>
  >(`${getHost(network)}/api/v1/common/tx/broadcast`, {
    method: "POST",
    data: { txHex },
    ...(options || {}),
  });
}

export async function deployCommit(
  network: API.Network,
  params: {
    commitTxRaw: string;
    revealTxRaw?: string;
    commitTxOutIndex?: number;
    orderId?: string;
  },
  options?: { [key: string]: any }
) {
  return request<
    API.Ret<{
      commitTxId: "string";
      orderId: "string";
      revealTxId: "string";
      tickId: "string";
    }>
  >(`${getHost(network)}/api/v1/inscribe/mrc20/deploy/commit`, {
    method: "POST",
    data: params,
    ...(options || {}),
  });
}

export async function getMrc20InscribeOrders(
  network: API.Network,
  params: {
    opOrderType: string; //deploy, mint, transfer
    address: string;
    tickId?: string;
    cursor: number;
    size: number;
  },
  options?: { [key: string]: any }
) {
  return request<API.ListRet<API.Mrc20InscribeOrder>>(
    `${getHost(network)}/api/v1/inscribe/mrc20/orders`,
    {
      method: "GET",
      params,
      ...(options || {}),
    }
  );
}

export async function getIdCoinInscribeOrders(
  network: API.Network,
  params: {
    opOrderType: string; //deploy, mint, transfer
    address: string;
    tickId?: string;
    cursor: number;
    size: number;
  },
  options?: { [key: string]: any }
) {
  return request<API.ListRet<API.Mrc20InscribeOrder>>(
    `${getHost(network)}/api/v1/id-coins/inscribe/orders`,
    {
      method: "GET",
      params,
      ...(options || {}),
    }
  );
}

export const getMetaletUtxos = async (
  network: API.Network,
  params: {
    address: string; //deploy, mint, transfer
    unconfirmed: number;
    net: API.Network;
  },
  options?: { [key: string]: any }
) => {
  return request<API.Ret<API.UTXO[]>>(
    `https://www.metalet.space/wallet-api/v3/address/btc-utxo`,
    {
      method: "GET",
      params,
      ...(options || {}),
    }
  );
};

export async function deployIdCoinPre(
  network: API.Network,
  params: API.DeployIdCoinPreReq,
  options?: { [key: string]: any }
) {
  return request<API.Ret<API.DeployIdCoinPreRes>>(
    `${getHost(network)}/api/v1/id-coins/deploy/pre`,
    {
      method: "POST",
      data: params,
      ...(options || {}),
    }
  );
}

//deployIdCoinCommit

export async function deployIdCoinCommit(
  network: API.Network,
  params: {
    orderId: string;
    commitTxRaw: string;
    commitTxOutIndex: number; //commit交易中RevealAddress的output索引
  },
  options?: { [key: string]: any }
) {
  return request<
    API.Ret<{
      orderId: string;
      commitTxId: string;
      revealTxId: string;
      tickId: string;
      pinId: string;
      txId: string;
    }>
  >(`${getHost(network)}/api/v1/id-coins/deploy/commit`, {
    method: "POST",
    data: params,
    ...(options || {}),
  });
}

export async function getIdCoinList(
  network: API.Network,
  params: {
    cursor: number;
    size: number;
    address?: string;
    followerAddress?: string;
    searchTick?: string;
    orderBy?: string;
    sortType?: number;
  },
  options?: { [key: string]: any }
) {
  return request<API.ListRet<API.IdCoin>>(
    `${getHost(network)}/api/v1/id-coins/coins-list`,
    {
      method: "GET",
      params,
      ...(options || {}),
    }
  );
}

export async function mintIdCoinPre(
  network: API.Network,
  params: {
    networkFeeRate: number;
    tickId: string;
    outAddress: string;
    outValue: number;
  },
  options?: { [key: string]: any }
) {
  return request<API.Ret<API.MintIdCoinPreRes>>(
    `${getHost(network)}/api/v1/id-coins/mint/pre`,
    {
      method: "POST",
      data: params,
      ...(options || {}),
    }
  );
}

export async function mintIdCoinCommit(
  network: API.Network,
  params: {
    orderId: string;
    commitTxRaw: string;
    commitTxOutInscribeIndex: number; //commit交易中RevealAddress的Inscribe-output索引
    commitTxOutMintIndex: number; //commit交易中RevealAddress的Mint-output索引
  },
  options?: { [key: string]: any }
) {
  return request<
    API.Ret<{
      orderId: string;
      commitTxId: string;
      revealInscribeTxId: string;
      revealMintTxId: string;
    }>
  >(`${getHost(network)}/api/v1/id-coins/mint/commit`, {
    method: "POST",
    data: params,
    ...(options || {}),
  });
}

export async function getIdCoinInfo(
  network: API.Network,
  params: {
    tickId?: string;
    issuerAddress?: string;
    tick?: string;
  },
  options?: { [key: string]: any }
) {
  return request<API.Ret<API.IdCoin>>(
    `${getHost(network)}/api/v1/id-coins/coins-info`,
    {
      method: "GET",
      params,
      ...(options || {}),
    }
  );
}

export async function getIdCoinMintOrder(
  network: API.Network,
  params: {
    tickId?: string;
    address?: string;
  },
  options?: { [key: string]: any }
) {
  return request<API.Ret<{ addressMintState: number }>>(
    `${getHost(network)}/api/v1/id-coins/address/mint/order`,
    {
      method: "GET",
      params,
      ...(options || {}),
    }
  );
}

export async function deployMRC20Pre(
  network: API.Network,
  params: API.DeployMRC20PreReq,
  options?: { [key: string]: any }
) {
  return request<API.Ret<API.DeployMRC20PreRes>>(
    `${getHost(network)}/api/v1/inscribe/mrc20/deploy/pre`,
    {
      method: "POST",
      data: params,
      ...(options || {}),
    }
  );
}

export async function checkUserCanDeployIdCoin(
  network: API.Network,
  params: {
    address: string;
  },
  options?: { [key: string]: any }
) {
  return request<
    API.Ret<{
      canDeploy: boolean;
      msg: string;
    }>
  >(`${getHost(network)}/api/v1/id-coins/deploy/check/info`, {
    method: "GET",
    params,
    ...(options || {}),
  });
}

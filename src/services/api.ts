import { request } from "umi";

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
    tickId: string;
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
    address:string;
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
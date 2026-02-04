import { DOGE_DUST_LIMIT, DOGE_DEFAULT_OUTPUT_VALUE } from "@/config";

// Doge 链的常量
export const DOGE_SATS_PER_COIN = 1e8; // 1 DOGE = 100,000,000 satoshis

// 判断地址是否是 Doge 地址
export const isDogeAddress = (address: string): boolean => {
  // Doge mainnet 地址以 D 开头，testnet 以 n 开头
  return address?.startsWith("D") || address?.startsWith("n");
};

// 判断是否支持 Doge MRC20
export const isSupportDogeMrc20 = (): boolean => {
  return !!(window.metaidwallet && window.metaidwallet.doge);
};

// 格式化 Doge 金额（从 satoshis 转换为 DOGE）
export const formatDoge = (satoshis: number, decimals: number = 8): string => {
  return (satoshis / DOGE_SATS_PER_COIN).toFixed(decimals);
};

// 获取 MRC-20 API 的 source 参数（BTC 和 Doge 通用）
export const getMrc20Source = (): string => {
  return "mrc20-v2";
};

// 获取 Doge 链的 source 参数（兼容旧代码）
export const getDogeSource = (): string => {
  return "mrc20-v2";
};

// Doge 链的网络参数配置
export const dogeNetworkParams = {
  messagePrefix: "\x19Dogecoin Signed Message:\n",
  bech32: "", // Doge 不支持 bech32
  bip32: {
    public: 0x02facafd,
    private: 0x02fac398,
  },
  pubKeyHash: 0x1e, // D 开头的地址
  scriptHash: 0x16,
  wif: 0x9e,
};

// Doge testnet 网络参数
export const dogeTestnetParams = {
  messagePrefix: "\x19Dogecoin Signed Message:\n",
  bech32: "",
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 0x71, // n 开头的地址
  scriptHash: 0xc4,
  wif: 0xf1,
};

// 获取 Doge 的 dust limit
export const getDogeDustLimit = (): number => {
  return DOGE_DUST_LIMIT;
};

// 获取 Doge 默认输出值
export const getDogeDefaultOutputValue = (): number => {
  return DOGE_DEFAULT_OUTPUT_VALUE;
};

// 根据链类型获取正确的 dust limit
export const getDustLimitByChain = (chain: API.Chain): number => {
  return chain === "doge" ? DOGE_DUST_LIMIT : 546;
};

// 根据链类型获取默认输出值
export const getDefaultOutputValueByChain = (chain: API.Chain): number => {
  return chain === "doge" ? DOGE_DEFAULT_OUTPUT_VALUE : 546;
};

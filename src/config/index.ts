const TESTNET_CONTENT_HOST = "https://man-test.metaid.io";
const MAINNET_CONTENT_HOST = "https://man.metaid.io";
export const TESTNET_PIN_FEE_ADDRESS =
  "tb1pf4gj2uyjfytzzx3h06m977tvw6pl6hgy6kmgyle2757pcrrukr8sac4r7m";
export const MAINNET_PIN_FEE_ADDRESS =
  "bc1pf4gj2uyjfytzzx3h06m977tvw6pl6hgy6kmgyle2757pcrrukr8s2srvy5";
export const MAINNET_PIN_FEE_AMOUNT = "1999";
export const TESTNET_PIN_FEE_AMOUNT = "1999";
export const getHostByNet = (network: API.Network) => {
  if (network === "testnet") return TESTNET_CONTENT_HOST;
  return MAINNET_CONTENT_HOST;
};

export const curNetwork: API.Network =
  window.METAID_MARKET_NETWORK || "mainnet";
console.log(curNetwork,'curNetwork')
export const getCreatePinFeeByNet = (
  network: API.Network
): { address: string; satoshis: string } => {
  if (network === "testnet")
    return {
      address: TESTNET_PIN_FEE_ADDRESS,
      satoshis: TESTNET_PIN_FEE_AMOUNT,
    };
  return {
    address: MAINNET_PIN_FEE_ADDRESS,
    satoshis: MAINNET_PIN_FEE_AMOUNT,
  };
};

const TESTNET_CONTENT_HOST = "https://man-test.metaid.io";
const MAINNET_CONTENT_HOST = "https://man.metaid.io";
export const getHostByNet = (network: API.Network) => {
  if (network === "testnet") return TESTNET_CONTENT_HOST;
  return MAINNET_CONTENT_HOST;
};

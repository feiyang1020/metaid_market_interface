import mempoolJS from "@mempool/mempool.js";

export const getFeeRate = async (network: API.Network) => {
  const {
    bitcoin: { fees },
  } = mempoolJS({
    hostname: "mempool.space",
    network: network === "mainnet" ? "main" : "testnet",
  });

  const feesRecommended = await fees.getFeesRecommended();
  console.log(feesRecommended);
  return [
    {
      label: "Fast",
      value: feesRecommended.fastestFee,
      time: "15 minutes",
    },
    {
      label: "Avg",
      value: feesRecommended.halfHourFee,
      time: "30 minutes",
    },
    {
      label: "Slow",
      value: feesRecommended.hourFee,
      time: "about 1 hour",
    },
  ];
};

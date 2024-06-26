import mempoolJS from "@mempool/mempool.js";

export const getFeeRate = async (network: API.Network) => {
  const {
    bitcoin: { fees },
  } = mempoolJS({
    hostname: "mempool.space",
    network: network === "mainnet" ? "main" : "testnet",
  });
  try{
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
  }catch(e){
    console.log(e);
    return [
      {
        label: "Fast",
        value: 0,
        time: "15 minutes",
      },
      {
        label: "Avg",
        value: 0,
        time: "30 minutes",
      },
      {
        label: "Slow",
        value: 0,
        time: "about 1 hour",
      },
    ];
  }

  
};

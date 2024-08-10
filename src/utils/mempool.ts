import mempoolJS from "@mempool/mempool.js";
import Slow from "@/assets/icons/motorcycle.svg";
import activeSlow from "@/assets/icons/motorcycle (1).svg";
import Avg from "@/assets/icons/van.svg";
import activeAvg from "@/assets/icons/van (1).svg";

import fast from "@/assets/icons/rocket.svg";
import activefast from "@/assets/icons/rocket (1).svg";
import { fetchFeeRecommend } from "@/services/api";

export const getFeeRate = async (network: API.Network) => {
  const {
    bitcoin: { fees },
  } = mempoolJS({
    hostname: "mempool.space",
    network: network === "mainnet" ? "main" : "testnet",
  });
  try {
    const feesRecommended = await fees.getFeesRecommended();
    let { fastestFee, halfHourFee, hourFee, minimumFee } = feesRecommended;
    return [
      {
        label: "Fast",
        value: fastestFee,
        time: "15 minutes",
        icon: fast,
        activeIcon: activefast,
      },
      {
        label: "Avg",
        value: halfHourFee,
        time: "30 minutes",
        icon: Avg,
        activeIcon: activeAvg,
      },
      {
        label: "Slow",
        value: hourFee,
        time: "about 1 hour",
        icon: Slow,
        activeIcon: activeSlow,
      },
    ];
  } catch (e) {
    try {
      const { code, data } = await fetchFeeRecommend(network);
      if (code !== 0) throw new Error("fetch fee rate error");
      const { fastestFee, halfHourFee, hourFee, minimumFee } = data;
      console.log(fastestFee, halfHourFee, hourFee, minimumFee);
      return [
        {
          label: "Fast",
          value: fastestFee,
          time: "15 minutes",
          icon: fast,
          activeIcon: activefast,
        },
        {
          label: "Avg",
          value: halfHourFee,
          time: "30 minutes",
          icon: Avg,
          activeIcon: activeAvg,
        },
        {
          label: "Slow",
          value: hourFee,
          time: "about 1 hour",
          icon: Slow,
          activeIcon: activeSlow,
        },
      ];
    } catch (e) {
      return [];
    }
  }
};

export const getMinFeeRate = async (network: API.Network) => {
  const {
    bitcoin: { fees },
  } = mempoolJS({
    hostname: "mempool.space",
    network: network === "mainnet" ? "main" : "testnet",
  });
  try {
    const feesRecommended = await fees.getFeesRecommended();
    let { minimumFee } = feesRecommended;
    return minimumFee;
  } catch (e) {
    try {
      const { code, data } = await fetchFeeRecommend(network);
      if (code !== 0) throw new Error("fetch fee rate error");
      const { minimumFee } = data;
      return minimumFee;
    } catch (e) {
      return 1;
    }
  }
};

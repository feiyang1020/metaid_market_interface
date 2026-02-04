import mempoolJS from "@mempool/mempool.js";
import Slow from "@/assets/icons/motorcycle.svg";
import activeSlow from "@/assets/icons/motorcycle (1).svg";
import Avg from "@/assets/icons/van.svg";
import activeAvg from "@/assets/icons/van (1).svg";

import fast from "@/assets/icons/rocket.svg";
import activefast from "@/assets/icons/rocket (1).svg";
import { fetchFeeRecommend, fetchDogeFeeRecommend } from "@/services/api";

export const getFeeRate = async (network: API.Network) => {
  try {
    const { code, data } = await fetchFeeRecommend(network);
    if (code !== 0) throw new Error("fetch fee rate error");
    const { fastestFee, halfHourFee, hourFee, minimumFee } = data;
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
      const {
        bitcoin: { fees },
      } = mempoolJS({
        hostname: "mempool.space",
        network: network === "mainnet" ? "main" : "testnet",
      });
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
      return [];
    }
  }
};

export const getMinFeeRate = async (network: API.Network) => {
  try {
    const { code, data } = await fetchFeeRecommend(network);
    if (code !== 0) throw new Error("fetch fee rate error");
    const { minimumFee } = data;
    return minimumFee;
  } catch (e) {
    try {
      const {
        bitcoin: { fees },
      } = mempoolJS({
        hostname: "mempool.space",
        network: network === "mainnet" ? "main" : "testnet",
      });
      const feesRecommended = await fees.getFeesRecommended();
      let { minimumFee } = feesRecommended;
      return minimumFee;
    } catch (e) {
      return 1;
    }
  }
};

// Doge 费率获取
export const getDogeFeeRate = async () => {
  try {
    const data = await fetchDogeFeeRecommend();
    const { fastestFee, halfHourFee, hourFee } = data;
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
    // 返回默认值
    return [
      {
        label: "Fast",
        value: 7500000,
        time: "15 minutes",
        icon: fast,
        activeIcon: activefast,
      },
      {
        label: "Avg",
        value: 5000000,
        time: "30 minutes",
        icon: Avg,
        activeIcon: activeAvg,
      },
      {
        label: "Slow",
        value: 5000000,
        time: "about 1 hour",
        icon: Slow,
        activeIcon: activeSlow,
      },
    ];
  }
};

export const getDogeMinFeeRate = async () => {
  try {
    const data = await fetchDogeFeeRecommend();
    return data.minimumFee || 5000000;
  } catch (e) {
    return 5000000;
  }
};

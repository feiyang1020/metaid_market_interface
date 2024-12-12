import {
  initEccLib,
  address as addressLib,
  Psbt,
  payments,
} from "bitcoinjs-lib";
import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";
import { InscribeData } from "node_modules/@metaid/metaid/dist/core/entity/btc";
import { BtcConnector } from "node_modules/@metaid/metaid/dist/core/connector/btc";
import { curNetwork, getCreatePinFeeByNet } from "@/config";
import { IBtcConnector } from "@metaid/metaid";

export const createMetaName = async (
  name: string,
  btcConnector: IBtcConnector,
  feeRate: number,
  namespace: string = "metaid"
) => {
  await initEccLib(ecc);
  const metaidData: InscribeData = {
    operation: "create",
    body: JSON.stringify({
      name,
      rev: await window.metaidwallet.btc.getAddress(),
      relay: "",
      metadata: "",
    }),
    path: `/metaname/${namespace}`,
    contentType: "application/json",
    flag: "metaid",
  };

  const ret = await btcConnector.inscribe({
    inscribeDataArray: [metaidData],
    options: {
      noBroadcast: "no",
      feeRate: Number(feeRate),
      service: getCreatePinFeeByNet(curNetwork),
    },
  });
  if(ret.status){
    throw new Error(ret.status);
  }
  return ret;
};

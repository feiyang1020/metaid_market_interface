import { useCallback, useEffect, useState } from "react";
import { MetaletWalletForBtc } from "@metaid/metaid";
import {
  IMetaletWalletForBtc,
  IBtcConnector,
  btcConnect,
} from "@metaid/metaid";
import { determineAddressInfo, formatSat } from "@/utils/utlis";
import { getFeeRate } from "@/utils/mempool";

export type Network = "mainnet" | "testnet";
type WalletName = "metalet";
const { metaidwallet } = window;
const checkExtension = () => {
  if (!window.metaidwallet) {
    window.open(
      "https://chromewebstore.google.com/detail/metalet/lbjapbcmmceacocpimbpbidpgmlmoaao"
    );
    return false;
  }
  return true;
};
export default () => {
  const [walletName, setWalletName] = useState<WalletName>("metalet");
  const [mvcAddress, setMVCAddress] = useState<string>();
  const [addressType, setAddressType] = useState<string>();
  const [metaid, setMetaid] = useState<string>();
  const [btcAddress, setBTCAddress] = useState<string>();
  const [btcConnector, setBtcConnector] = useState<IMetaletWalletForBtc>();
  const [loginModalShow, setLoginModalShow] = useState<boolean>(false);
  const [network, setNetwork] = useState<Network>("testnet");
  const [connected, setConnected] = useState<boolean>(false);
  const [userBal, setUserBal] = useState<string>("0");
  const [avatar, setAvatar] = useState<string>("");
  const [walletParams, setWalletParams] = useState(
    sessionStorage.getItem("walletParams") || ""
  );
  const [feeRates, setFeeRates] = useState<
    {
      label: string;
      value: number;
      time: string;
    }[]
  >([]);

  const connect = async () => {
    if (!checkExtension()) return;
    const _wallet = await MetaletWalletForBtc.create();
    console.log(_wallet);
    if (!_wallet.address) return;
    const _btcConnector: IMetaletWalletForBtc = await btcConnect({
      wallet: _wallet,
      network,
    });

    const _walletParams = {
      address: _wallet.address,
      pub: _wallet.pub,
    };
    sessionStorage.setItem("walletParams", JSON.stringify(_walletParams));
    setBtcConnector(_btcConnector);
    console.log(_btcConnector);
    setConnected(true);
    setBTCAddress(_btcConnector.wallet.address);
    setAddressType(
      determineAddressInfo(_btcConnector.wallet.address).toUpperCase()
    );
    const bal = await _btcConnector.wallet.getBalance();
    setUserBal(formatSat(bal.total));
    setAvatar(_btcConnector.user.avatar);
  };

  const disConnect = async () => {
    if (!checkExtension()) return;
    // const ret = await window.metaidwallet.disconnect();
    // if (ret.status === "canceled") return;
    setConnected(false);
    setMVCAddress("");
    setBTCAddress("");
    setUserBal("");
    sessionStorage.removeItem("walletParams");
  };

  const fetchFeeRate = useCallback(async () => {
    if (network) {
      const ret = await getFeeRate(network);
      setFeeRates(ret);
    }
  }, [network]);

  const init = useCallback(async () => {
    console.log("init", walletName, window.metaidwallet);
    if (walletName === "metalet" && window.metaidwallet) {
      if (walletParams) {
        const _walletParams = JSON.parse(walletParams);
        const _wallet = MetaletWalletForBtc.restore({
          ..._walletParams,
          internal: window.metaidwallet,
        });
        const btcAddress = await window.metaidwallet.btc.getAddress();
        if(btcAddress!==_walletParams.address){
          disConnect();
          return
        }
        const _network = (await window.metaidwallet.getNetwork()).network;
        console.log(_network);
        setNetwork(_network);
        const _btcConnector: IMetaletWalletForBtc = await btcConnect({
          wallet: _wallet,
          network: _network,
        });

        setBtcConnector(_btcConnector);
        console.log(_btcConnector);
        setConnected(true);
        setMetaid(_btcConnector.metaid);
        setBTCAddress(_btcConnector.wallet.address);
        setAddressType(
          determineAddressInfo(_btcConnector.wallet.address).toUpperCase()
        );
        const bal = await _btcConnector.wallet.getBalance();
        setUserBal(formatSat(bal.total));
        setAvatar(_btcConnector.user.avatar);
      }
    }
  }, [walletName, walletParams]);
  useEffect(() => {
    //
    setTimeout(() => {
      init();
      fetchFeeRate();
    }, 500);
  }, [init, fetchFeeRate]);

  useEffect(() => {
    const handleAccountChange = (newAccount: any) => {
      disConnect();
    };
    const handleNetChange = (network: string) => {
      disConnect();
    };
    if (walletName === "metalet" && window.metaidwallet && connected) {
      window.metaidwallet.on("accountsChanged", handleAccountChange);
      window.metaidwallet.on("networkChanged", handleNetChange);
    }

    return () => {
      if (walletName === "metalet" && window.metaidwallet && connected) {
        window.metaidwallet.removeListener(
          "accountsChanged",
          handleAccountChange
        );
        window.metaidwallet.removeListener("networkChanged", handleNetChange);
      }
    };
  }, [walletName, connected]);

  return {
    mvcAddress,
    btcAddress,
    network,
    connected,
    connect,
    userBal,
    setLoginModalShow,
    addressType,
    loginModalShow,
    disConnect,
    metaid,
    btcConnector,
    avatar,
    feeRates,
  };
};

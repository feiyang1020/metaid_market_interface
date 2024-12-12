import { useCallback, useEffect, useState } from "react";
import { MetaletWalletForBtc } from "@metaid/metaid";
import {
  IMetaletWalletForBtc,
  IBtcConnector,
  btcConnect,
} from "@metaid/metaid";
import { determineAddressInfo, formatSat } from "@/utils/utlis";
import { getFeeRate } from "@/utils/mempool";
import { curNetwork, getHostByNet } from "@/config";
import useIntervalAsync from "@/hooks/useIntervalAsync";
import { getBTCPrice } from "@/services/api";

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
type AuthParams = { "X-Signature": string; "X-Public-Key": string };
export default () => {
  const [walletName, setWalletName] = useState<WalletName>("metalet");
  const [addressType, setAddressType] = useState<string>();
  const [metaid, setMetaid] = useState<string>();
  const [btcAddress, setBTCAddress] = useState<string>();
  const [btcConnector, setBtcConnector] = useState<IBtcConnector>();
  const [network, setNetwork] = useState<Network>(curNetwork);
  const [connected, setConnected] = useState<boolean>(false);
  const [userBal, setUserBal] = useState<string>("0");
  const [avatar, setAvatar] = useState<string>("");
  const [userName, setUserName] = useState<string>();
  const [authParams, setAuthParams] = useState<AuthParams>();
  const [initializing, setInitializing] = useState<boolean>(true);

  const [feeRates, setFeeRates] = useState<
    {
      label: string;
      value: number;
      time: string;
      icon: string;
      activeIcon: string;
    }[]
  >([]);
  const [feeRate, setFeeRate] = useState<number>(0);
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [feeRateType, setFeeRateType] = useState<string>("");
  const [feeRateModalVisible, setFeeRateModelVisible] =
    useState<boolean>(false);

  const connect = async () => {
    if (!checkExtension()) return;
    let { network: _net, status } = await window.metaidwallet.getNetwork();
    let _wallet: IMetaletWalletForBtc | undefined = undefined;
    if (status === "not-connected") {
      _wallet = await MetaletWalletForBtc.create();
      _net = (await window.metaidwallet.getNetwork()).network;
    }
    if (_net !== curNetwork) {
      const ret = await window.metaidwallet.switchNetwork(
        curNetwork === "testnet" ? "testnet" : "livenet"
      );
      if (ret.status === "canceled") return;
      const { network } = await window.metaidwallet.getNetwork();
      if (network !== curNetwork) {
        return;
      }
    }
    if (_wallet === undefined) {
      _wallet = await MetaletWalletForBtc.create();
    }
    if (!_wallet.address) return;

    const publicKey = await window.metaidwallet.btc.getPublicKey();
    const publicKeySign =
      await window.metaidwallet.btc.signMessage("metaid.market");
    if (publicKeySign.status) return;
    setNetwork(curNetwork);
    setAuthParams({ "X-Public-Key": publicKey, "X-Signature": publicKeySign });
    sessionStorage.setItem(
      "authParams",
      JSON.stringify({
        "X-Public-Key": publicKey,
        "X-Signature": publicKeySign,
      })
    );
    const _btcConnector: IBtcConnector = await btcConnect({
      wallet: _wallet,
      network,
    });
    const _walletParams = {
      address: _wallet.address,
      pub: publicKey,
    };
    sessionStorage.setItem("walletParams", JSON.stringify(_walletParams));
    setInitializing(true);
    setBtcConnector(_btcConnector);
    setConnected(true);
    setBTCAddress(_btcConnector.wallet.address);
    setAddressType(
      determineAddressInfo(_btcConnector.wallet.address).toUpperCase()
    );
    const bal = await _btcConnector.wallet.getBalance();
    setUserBal(formatSat(bal.total));
    setAvatar(
      _btcConnector.user.avatar
        ? `${getHostByNet(network)}${_btcConnector.user.avatar}`
        : ""
    );
    setMetaid(_btcConnector.user.metaid);
    setUserName(_btcConnector.user.name);
    setInitializing(false);
  };

  const disConnect = async () => {
    setConnected(false);
    setBTCAddress("");
    setUserBal("");
    setBtcConnector(undefined);
    setAddressType(undefined);
    setAvatar("");
    setMetaid("");
    setUserName("");
    setAuthParams(undefined);
    sessionStorage.removeItem("walletParams");
    sessionStorage.removeItem("authParams");
  };

  const fetchFeeRate = useCallback(async () => {
    if (network) {
      const ret = await getFeeRate(network);
      setFeeRates(ret);

      setFeeRate((prev) => {
        if (prev === 0) {
          if (ret.length === 0) {
            return Number(localStorage.getItem("mk_lastFeeRate")) || 1;
          }
          return ret[1].value;
        }
        return prev;
      });
      setFeeRateType((prev) => {
        if (prev === "") {
          if (ret.length === 0) {
            return "Custom";
          }
          return ret[1].label;
        }
        return prev;
      });
    }
  }, [network]);

  const fetchBTCPrice = useCallback(async () => {
    const res = await getBTCPrice(network);
    const price = res.data.USD;
    if (!price) {
      setBtcPrice(0);
    } else {
      setBtcPrice(price);
    }
  }, [network]);

  const _setFeeRate = (_feeRate: number) => {
    localStorage.setItem("mk_lastFeeRate", _feeRate.toString());
    setFeeRate(_feeRate);
  };

  const init = useCallback(async () => {
    if (walletName === "metalet" && window.metaidwallet) {
      const _network = (await window.metaidwallet.getNetwork()).network;
      if (_network !== curNetwork) {
        disConnect();
        setInitializing(false);
        return;
      }
      setNetwork(_network);
      const walletParams = sessionStorage.getItem("walletParams");
      if (walletParams) {
        let _authParams: AuthParams | undefined = undefined;
        if (sessionStorage.getItem("authParams")) {
          _authParams = JSON.parse(
            sessionStorage.getItem("authParams") || ""
          ) as AuthParams;
        }
        if (!_authParams) {
          disConnect();
          setInitializing(false);
          return;
        }
        const _walletParams = JSON.parse(walletParams);
        if (_authParams && _authParams["X-Public-Key"] !== _walletParams.pub) {
          disConnect();
          setInitializing(false);
          return;
        }
        const _wallet = MetaletWalletForBtc.restore({
          ..._walletParams,
          internal: window.metaidwallet,
        });
        const btcAddress = await window.metaidwallet.btc.getAddress();
        const pubKey = await window.metaidwallet.btc.getPublicKey();
        if (btcAddress !== _walletParams.address) {
          disConnect();
          setInitializing(false);
          return;
        }
        if (pubKey !== _walletParams.pub) {
          disConnect();
          setInitializing(false);
          return;
        }
        setAuthParams((prev) => {
          if (!prev) {
            return _authParams;
          }
          if (prev["X-Public-Key"] === _authParams?.["X-Public-Key"]) {
            return prev;
          }
          return _authParams;
        });
        const _btcConnector: IBtcConnector = await btcConnect({
          wallet: _wallet,
          network: _network,
        });

        setBtcConnector(_btcConnector);
        setConnected(true);
        setMetaid(_btcConnector.metaid);
        setBTCAddress(_btcConnector.wallet.address);
        setAddressType(
          determineAddressInfo(_btcConnector.wallet.address).toUpperCase()
        );
        try {
          const bal = await _btcConnector.wallet.getBalance();
          setUserBal(formatSat(bal.total));
        } catch (err) {
          console.log(err, "getBalance");
        }
        setAvatar(
          _btcConnector.user.avatar
            ? `${getHostByNet(network)}${_btcConnector.user.avatar}`
            : ""
        );
        setMetaid(_btcConnector.user.metaid);
        setUserName(_btcConnector.user.name);
        setInitializing(false);
      }
    }
    setInitializing(false);
  }, [walletName]);
  useEffect(() => {
    //
    setTimeout(() => {
      init();
    }, 500);
  }, [init]);

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

  const updateWalletInfo = useIntervalAsync(init, 60000);
  const updateFeeRate = useIntervalAsync(fetchFeeRate, 60000);
  const updateBTCPrice = useIntervalAsync(fetchBTCPrice, 60000);

  return {
    btcAddress,
    network,
    connected,
    connect,
    userBal,
    addressType,
    disConnect,
    metaid,
    btcConnector,
    avatar,
    userName,
    feeRates,
    authParams,
    updateWalletInfo,
    updateFeeRate,
    init,
    initializing,
    setFeeRate: _setFeeRate,
    feeRate,
    feeRateType,
    setFeeRateType,
    setFeeRateModelVisible,
    feeRateModalVisible,
    btcPrice,
  };
};

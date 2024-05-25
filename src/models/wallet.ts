import { useCallback, useEffect, useState } from "react";
import { MetaletWalletForBtc } from "@metaid/metaid";
import {
  IMetaletWalletForBtc,
  IBtcConnector,
  btcConnect,
} from "@metaid/metaid";
import { determineAddressInfo, formatSat } from "@/utils/utlis";
import { getFeeRate } from "@/utils/mempool";
import { getHostByNet } from "@/config";
import useIntervalAsync from "@/hooks/useIntervalAsync";

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
  const [btcConnector, setBtcConnector] = useState<IMetaletWalletForBtc>();
  const [network, setNetwork] = useState<Network>("testnet");
  const [connected, setConnected] = useState<boolean>(false);
  const [userBal, setUserBal] = useState<string>("0");
  const [avatar, setAvatar] = useState<string>("");
  const [userName, setUserName] = useState<string>();
  const [authParams, setAuthParams] = useState<AuthParams>();

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
    if (!_wallet.address) return;
    const { network } = await window.metaidwallet.getNetwork();
    setNetwork(network);
    const publicKey = await window.metaidwallet.btc.getPublicKey();
    const publicKeySign = await window.metaidwallet.btc.signMessage(
      "metaid.market"
    );
    if (publicKeySign.status) return;
    setAuthParams({ "X-Public-Key": publicKey, "X-Signature": publicKeySign });
    sessionStorage.setItem(
      "authParams",
      JSON.stringify({
        "X-Public-Key": publicKey,
        "X-Signature": publicKeySign,
      })
    );
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
    }
  }, [network]);

  const init = useCallback(async () => {
    if (walletName === "metalet" && window.metaidwallet) {
      const _network = (await window.metaidwallet.getNetwork()).network;
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
          return;
        }
        const _walletParams = JSON.parse(walletParams);
        if (_authParams && _authParams["X-Public-Key"] !== _walletParams.pub) {
          disConnect();
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
          return;
        }
        if (pubKey !== _walletParams.pub) {
          disConnect();
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
        const _btcConnector: IMetaletWalletForBtc = await btcConnect({
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
        const bal = await _btcConnector.wallet.getBalance();
        setUserBal(formatSat(bal.total));
        setAvatar(
          _btcConnector.user.avatar
            ? `${getHostByNet(network)}${_btcConnector.user.avatar}`
            : ""
        );
        setMetaid(_btcConnector.user.metaid);
        setUserName(_btcConnector.user.name);
      }
    }
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
  };
};

import useIntervalAsync from "@/hooks/useIntervalAsync";
import { getAssets, getContent, getOrders } from "@/services/api";
import { useCallback, useState } from "react";
import { useModel } from "umi";

export default () => {
  const size = 50;
  const { network, btcAddress, connected } = useModel("wallet");
  const [sortKey, setSortKey] = useState<string>("timestamp");
  const [sortType, setSortType] = useState<number>(-1);
  const [cursor, setCursor] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [orders, setOrders] = useState<API.Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const fetchOrders = useCallback(
    async (retry: boolean = true) => {
      if (network && connected) {
        try {
          const ret = await getAssets(network, {
            assetType: "pins",
            address: btcAddress,
            cursor,
            size,
          });
          console.log(ret);
          const list: API.Order[] = ret.data.list
            .filter((item) => item.orderId === "")
            .map((item) => {
              return {
                ...item,
                info: JSON.parse(item.detail),
              };
            });
          for (let i = 0; i < list.length; i++) {
            if (
              list[i].info &&
              list[i].info.contentTypeDetect.indexOf("text") > -1
            ) {
              const cont = await getContent(list[i].content);
              list[i].textContent =
                typeof cont === "object" ? JSON.stringify(cont) : cont;
            }
          }
          console.log(list);
          setOrders(list);
          setTotal(ret.data.total);
          setLoading(false);
        } catch (err: any) {
          console.log(err);
          if (
            err.message === "Request failed with status code 500" &&
            retry === true
          ) {
            fetchOrders(false);
          }
        }
        
      }
      setLoading(false);
    },
    [network, sortKey, sortType, cursor, btcAddress, connected]
  );
  const updateOrders: any = useIntervalAsync(fetchOrders, 90000);
  return {
    updateOrders,
    orders,
    total,
    cursor,
    sortKey,
    sortType,
    setCursor,
    setSortType,
    setSortKey,
    loading,
    setLoading,
  };
};

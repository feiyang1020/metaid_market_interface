import useIntervalAsync from "@/hooks/useIntervalAsync";
import { getContent, getOrders } from "@/services/api";
import { useCallback, useState } from "react";
import { useModel } from "umi";

export default () => {
  const size = 10;
  const { network, btcAddress } = useModel("wallet");
  const [sortKey, setSortKey] = useState<string>("timestamp");
  const [sortType, setSortType] = useState<number>(-1);
  const [cursor, setCursor] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [orders, setOrders] = useState<API.Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const fetchOrders = useCallback(
    async (retry: boolean = true) => {
      if (!btcAddress) {
        setOrders([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      if (network) {
        try {
          const ret = await getOrders(network, {
            assetType: "pins",
            orderState: 3,
            address: btcAddress,
            sortKey,
            sortType,
            cursor: cursor * size,
            size,
          });
          const list: API.Asset[] = ret.data.list.map((item) => {
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
              list[i].textContent = cont;
            }
          }
          setOrders(list);
          setTotal(ret.data.total);
          setLoading(false);
        } catch (err: any) {
          console.log(err);
          if (retry === true) {
            fetchOrders(false);
          }
        }
      }
    },
    [network, sortKey, sortType, cursor, btcAddress]
  );
  const updateOrders: any = useIntervalAsync(fetchOrders, 90000);
  return {
    updateOrders,
    orders,
    total,
    size,
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

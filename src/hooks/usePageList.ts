import { useCallback, useEffect, useState } from "react";

const usePageList = <R = unknown>(
  fn: (
    network: API.Network,
    params: { cursor: number; size: number } & Record<string, any>
  ) => Promise<API.ListRet<R>>,
  network: API.Network,
  
) => {
    console.log('usePageList');
  const [list, setList] = useState<R[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(10);
  const [params, setParams] = useState<Record<string, any>>({});
  const fetchData = useCallback(async () => {
    setLoading(true);
    const { code, message, data } = await fn(network, {
      cursor: page * size,
      size,
      ...params,
    });
    if(code !== 0)return
    if (data.list) {
      setList(data.list);
      setTotal(data.total);
    }
    setLoading(false);
  }, [network, page, size, params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  return {
    list,
    loading,
    total,
    page,
    setPage,
    size,
    setSize,
    setParams,
  };
};

export default usePageList;

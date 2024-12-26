import { ArrowLeftOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Space, Table, TableProps, Tooltip, Typography } from "antd";
import { useMatch, useModel } from "umi";
import dayjs from "dayjs";
import "./index.less";
import { formatSat } from "@/utils/utlis";
import { useCallback, useEffect, useMemo, useState } from "react";
import JSONView from "@/components/JSONView";
import { getTickHolders } from "@/services/api";
import NumberFormat from "@/components/NumberFormat";
import MetaIdAvatar from "@/components/MetaIdAvatar";
import MetaIDUser from "@/components/MetaIDUser";
import Trans from "@/components/Trans";

export default () => {
  const match = useMatch('/holders/:tick');
  const _tick = match?.params.tick;
  const [loading, setLoading] = useState<boolean>(true);
  const [list, setList] = useState<API.Holder[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [cursor, setCursor] = useState<number>(0);
  const [size, setSize] = useState<number>(10);
  const { btcAddress, network } = useModel("wallet");
  const fetchData = useCallback(async () => {
    if (!_tick) return;
    setLoading(true);
    const { code, message, data } = await getTickHolders(network, {
      tick: _tick,
      cursor: cursor * size,
      size,
    });
    if (code !== 0) return;
    if (data.list) {
      setList(data.list);
      setTotal(data.total);
    }
    setLoading(false);
  }, [network, cursor, size, _tick]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const columns: TableProps<API.Holder>["columns"] = [
    {
      title: <Trans>Name</Trans>,
      dataIndex: "name",
      key: "name",
      width: 300,
      render: (text, record, index) => {
        return <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="order">
            {cursor * size + index + 1}
          </div>
          <MetaIDUser name={record.userInfo && record.userInfo.name || ''} avatar={record.userInfo && record.userInfo.avatar} address={record.address} metaid={record.metaId} />

        </div>
      }
    },

    {
      title: <Trans>Address</Trans>,
      dataIndex: "address",
      key: "address",
      align: "center",
      render: (text) => {
        return (
          <Typography.Text style={{ color: "#fff", whiteSpace: 'nowrap' }} copyable={{ text }}>{text.replace(/(\w{5})\w+(\w{5})/, "$1...$2")}</Typography.Text>
        )
      },
    },
    {
      title:<Trans>Quantity</Trans> ,
      dataIndex: "balance",
      key: "balance",
      align: "center",
      render: (text) => {
        return <NumberFormat value={text} />
      }
    },
    {
      title:<Trans>Proportion%</Trans> ,
      dataIndex: "proportion",
      key: "proportion",
      align: "center",
      render: (text) => {
        return <NumberFormat value={text} precision={2} suffix="%" />
      }
    },
  ];
  return (
    <div className="historyPage animation-slide-bottom">
      <div
        className="title"
        onClick={() => {
          history.back();
        }}
      >
        <LeftOutlined /> <Trans>Holders</Trans>
      </div>
      <div className="tableWrap">

        <Table

          rowKey={"address"}
          loading={loading}
          columns={columns}
          dataSource={list}
          pagination={{
            position: ['bottomCenter'],
            onChange: (page, pageSize) => {
              setCursor(page - 1);
              setSize(pageSize || 10);
            },

            pageSize: size,
            total: total,
            current: cursor + 1,
          }}
          bordered
        />
      </div>
    </div>
  );
};

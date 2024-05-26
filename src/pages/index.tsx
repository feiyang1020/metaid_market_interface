import { Avatar, Button, Grid, List } from "antd";
import { SyncOutlined, UserOutlined } from "@ant-design/icons";
import "./index.less";
import { useModel } from "umi";
import Order from "@/components/Order";
import SortArrow from "@/components/SortArrow";
import { useEffect, useState } from "react";
import BuyModel from "@/components/BuyModel";

const { useBreakpoint } = Grid;

export default () => {
  const {
    orders,
    total,
    cursor,
    sortKey,
    sortType,
    setSortKey,
    setSortType,
    loading,
    setLoading,
    updateOrders,
    setCursor,
  } = useModel("orders");
  const [curOrder, setCurOrder] = useState<API.Order>();
  const [buyModalVisible, setBuyModalVisible] = useState<boolean>(false);
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortType(sortType === 1 ? -1 : 1);
    } else {
      setSortKey(key);
      setSortType(-1);
    }
    setLoading(true);
  };

  useEffect(() => {
    setLoading(true);
    updateOrders();
  }, []);

  return (
    <div className="indexPage animation-slide-bottom">
      <Button type="link">PIN</Button>
      <div className="actions">
        <div className="left">All Personal Information Nodes</div>
        <div className="right">
          <div
            className="sortItem"
            onClick={() => handleSort("sellPriceAmount")}
          >
            Price{" "}
            <SortArrow
              status={
                sortKey === "sellPriceAmount"
                  ? sortType === 1
                    ? "up"
                    : "down"
                  : undefined
              }
            ></SortArrow>
          </div>
          <div className="sortItem" onClick={() => handleSort("timestamp")}>
            Market Time{" "}
            <SortArrow
              status={
                sortKey === "timestamp"
                  ? sortType === 1
                    ? "up"
                    : "down"
                  : undefined
              }
            ></SortArrow>
          </div>
          <div className="sortItem" onClick={() => handleSort("assetlevel")}>
            Level{" "}
            <SortArrow
              status={
                sortKey === "assetlevel"
                  ? sortType === 1
                    ? "up"
                    : "down"
                  : undefined
              }
            ></SortArrow>
          </div>
          <Button
            onClick={() => {
              setLoading(true);
              updateOrders();
            }}
            icon={<SyncOutlined spin={loading} />}
          ></Button>
        </div>
      </div>
      <div className="list">
        <List
          loading={loading}
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 6 }}
          dataSource={orders}
          renderItem={(item) => (
            <List.Item>
              <Order
                item={item}
                handleBuy={(order) => {
                  setCurOrder(order);
                  setBuyModalVisible(true);
                }}
              />
            </List.Item>
          )}
          rowKey={"orderId"}
          pagination={{
            onChange: (page) => {
              setLoading(true);
              setCursor(page - 1);
            },
            position: "bottom",
            align: "center",
            pageSize: 12,
            total: total,
            current: cursor + 1,
          }}
        />
      </div>
      <BuyModel
        order={curOrder}
        show={buyModalVisible}
        onClose={() => {
          setBuyModalVisible(false);
          setCurOrder(undefined);
        }}
      />
    </div>
  );
};

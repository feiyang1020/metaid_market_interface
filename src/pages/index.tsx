import { Avatar, Button, Grid, List, Popover, Space } from "antd";
import { FilterOutlined, SyncOutlined, UserOutlined } from "@ant-design/icons";
import "./index.less";
import { useModel, useMatch, useNavigate } from "umi";
import Order from "@/components/Order";
import SortArrow from "@/components/SortArrow";
import { useEffect, useState } from "react";
import BuyModel from "@/components/BuyModel";
import Mrc20List from "@/components/Mrc20List";
import FilterForm from "@/components/FilterForm";
import MetaName from "@/components/MetaName";
import Trans from "@/components/Trans";

const { useBreakpoint } = Grid;
const items = ['MRC-20', "PIN"];


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
    tab,
    setTab,
    filterKey,
    size,
    setSize,
  } = useModel("orders");
  const match = useMatch('/market/:tab');
  const match2 = useMatch('/market/:tab/:mrc20Tab');
  const nav = useNavigate()
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


  const _tab = match?.params.tab || match2?.params.tab;
  useEffect(() => {
    if (_tab && items.includes(_tab)) {
      setTab(_tab as "PIN" | "MRC-20" | "MetaName");
    }
  }, [_tab]);



  return (
    <div className="indexPage ">
      <div className="tabs">
        <Space>
          {items.map((item) => (
            <Button
              key={item}
              type={tab === item ? "link" : "text"}
              onClick={() => {
                // nav({ search: '?tab=' + item })
                nav('/market/' + item, { replace: false })
                setTab(item)
              }}
              size="large"
            >
              <Trans>{item}</Trans>
              
            </Button>
          ))}
        </Space>
      </div>
      {tab === "PIN" && <>


        <div className="actions">
          <div className="left"><Trans>All Personal Information Nodes</Trans></div>
          <div className="right">
            <div
              className="sortItem"
              onClick={() => handleSort("sellPriceAmount")}
            >
              <Trans>Price</Trans>{" "}
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
              <Trans>Market Time</Trans>{" "}
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
             <Trans>Level</Trans> {" "}
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
            <Popover content={<FilterForm />} trigger={'click'} placement='bottomLeft'>
              <Button type={Object.keys(filterKey).length > 0 ? 'link' : 'text'} icon={<FilterOutlined />}></Button>
            </Popover>

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
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 6, xxl: 6 }}
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
              onChange: (page, pageSize) => {
                setLoading(true);
                setCursor(page - 1);
                setSize(pageSize || 10);
              },
              position: "bottom",
              align: "center",
              pageSize: size,
              total: total,
              current: cursor + 1,
            }}
          />
        </div>
      </>}
      {tab === "MRC-20" && <Mrc20List />}
      {tab === "MetaName" && <MetaName />}

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

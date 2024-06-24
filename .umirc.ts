import { defineConfig } from "umi";
export default defineConfig({
  routes: [
    { path: "/", component: "index", title: "" },
    { path: "/market", component: "index" },
    { path: "/inscribe", component: "inscribe" },
    { path: "/sale", component: "sale" },
    { path: "/order", component: "detail" },
    { path: "/history", component: "history" },
    { path: "/pending", component: "pending" },
    { path: "/mrc20/:mrc20Id", component: "mrc20" },
  ],
  title: "MetaID-Market",
  npmClient: "pnpm",
  plugins: ["@umijs/plugins/dist/model", "@umijs/plugins/dist/request",'@umijs/plugins/dist/locale'],
  model: {},
  request: {},
  locale: {
    default: 'en-US',
    baseSeparator: '-',
    antd: true,
    baseNavigator: false,
  },
  jsMinifier: "none",
  define: {
    "process.env.METAID_MARKET_NETWORK": process.env.METAID_MARKET_NETWORK,
  },
});

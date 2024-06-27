import { defineConfig } from "umi";
export default defineConfig({
  routes: [
    { path: "/", component: "inscribe", title: "" },
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

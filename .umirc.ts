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
  ],
  title: "MetaID-Market",
  npmClient: "pnpm",
  plugins: ["@umijs/plugins/dist/model", "@umijs/plugins/dist/request"],
  model: {},
  request: {},
  jsMinifier: "none",
  define: {
    "process.env.METAID_MARKET_NETWORK": process.env.METAID_MARKET_NETWORK,
  },
});

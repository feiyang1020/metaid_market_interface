import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/", component: "index" },
    { path: "/market", component: "index" },
    { path: "/inscribe", component: "inscribe" },
    { path: "/sale", component: "sale" },
    { path: "/order", component: "detail" },
    { path: "/history", component: "history" },
    { path: "/pending", component: "pending" },
  ],
  npmClient: 'pnpm',
  plugins: ["@umijs/plugins/dist/model", "@umijs/plugins/dist/request"],
  model: {},
  request: {},
  jsMinifier: 'none',
});

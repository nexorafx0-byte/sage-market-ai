import { createServerFn } from "@tanstack/react-start";

import { buildMarketAnalysis } from "./real-market.server";

export const getMarketAnalysis = createServerFn({ method: "GET" }).handler(async () => {
  return await buildMarketAnalysis();
});

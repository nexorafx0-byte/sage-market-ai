import { createServerFn } from "@tanstack/react-start";

import { buildMarketAnalysisSafe } from "./real-market.server";

export const getMarketAnalysis = createServerFn({ method: "GET" }).handler(async () => {
  return await buildMarketAnalysisSafe();
});

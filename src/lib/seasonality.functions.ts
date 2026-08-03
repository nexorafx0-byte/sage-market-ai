import { createServerFn } from "@tanstack/react-start";

import { buildSeasonality } from "./seasonality.server";

export const getSeasonality = createServerFn({ method: "GET" })
  .inputValidator((data: { symbol: string; years: number }) => ({
    symbol: String(data.symbol),
    years: Math.max(1, Math.min(25, Number(data.years) || 10)),
  }))
  .handler(async ({ data }) => {
    return await buildSeasonality(data.symbol, data.years);
  });

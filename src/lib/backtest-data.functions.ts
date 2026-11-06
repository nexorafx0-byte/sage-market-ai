import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { BACKTEST_SYMBOLS, BACKTEST_TIMEFRAMES } from "./backtest-types";

const inputSchema = z.object({
  symbol: z.enum(BACKTEST_SYMBOLS.map((item) => item.id) as ["EURUSD", "GBPUSD", "USDJPY", "EURJPY", "XAUUSD", "NASDAQ", "US30"]),
  timeframe: z.enum(BACKTEST_TIMEFRAMES.map((item) => item.id) as ["M1", "M5", "M15", "M30", "H1", "H4", "D1"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const getBacktestHistory = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { fetchBacktestHistory } = await import("./backtest-data.server");
    return fetchBacktestHistory(data);
  });

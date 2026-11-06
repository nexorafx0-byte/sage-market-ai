import { createFileRoute } from "@tanstack/react-router";

import BacktestingLab from "@/components/backtesting-lab";

export const Route = createFileRoute("/backtesting")({
  head: () => ({
    meta: [
      { title: "Backtesting Lab — MARKETMIND" },
      { name: "description", content: "Replay real historical candles, simulate trades with risk and costs, draw on charts and review backtest statistics." },
      { property: "og:title", content: "Backtesting Lab — MARKETMIND" },
      { property: "og:description", content: "A bar-by-bar trading simulator with private saved backtests, trade analytics and clear real-data or demo states." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BacktestingLab,
});

import { describe, expect, it } from "vitest";

import { calculateBacktestStats, evaluateTradeOnCandle, openSimulatedTrade, quoteTrade, rewindTradesToTime } from "./backtest-engine";
import { visibleCandles } from "./replay-engine";
import type { BacktestSettings, Candle } from "./backtest-types";

const settings: BacktestSettings = {
  startDate: "2026-01-01",
  endDate: "2026-01-02",
  initialCapital: 10_000,
  riskMode: "percent",
  riskValue: 1,
  spread: 0,
  commission: 0,
  slippage: 0,
  autoSize: false,
};

const candle = (time: number, open: number, high: number, low: number, close: number): Candle => ({ time, open, high, low, close, volume: 0 });

function buyTrade() {
  return openSimulatedTrade({ id: "one", symbol: "EURUSD", direction: "buy", time: 100, entryPrice: 1.1, stopLoss: 1.099, takeProfit: 1.102, lotSize: 1, settings });
}

describe("replay engine", () => {
  it("never returns candles after the current replay point", () => {
    const candles = [candle(60, 1, 2, 0, 1), candle(120, 1, 3, 0, 2), candle(180, 2, 4, 1, 3)];
    expect(visibleCandles(candles, 1).map((item) => item.time)).toEqual([60, 120]);
    expect(visibleCandles(candles, 0).some((item) => item.time > 60)).toBe(false);
  });
});

describe("backtest engine", () => {
  it("uses Stop Loss when SL and TP are both inside one candle", () => {
    const result = evaluateTradeOnCandle(buyTrade(), candle(200, 1.1, 1.103, 1.098, 1.1), settings);
    expect(result.status).toBe("closed");
    expect(result.closeReason).toBe("stop_loss");
    expect(result.exitPrice).toBe(1.099);
  });

  it("calculates euro risk and reward from stop and target distance", () => {
    const quote = quoteTrade({ symbol: "EURUSD", direction: "buy", entryPrice: 1.1, stopLoss: 1.099, takeProfit: 1.102, lotSize: 2, settings });
    expect(quote.riskEur).toBe(18.4);
    expect(quote.potentialEur).toBe(36.8);
    expect(quote.rr).toBe(2);
  });

  it("reopens a future exit and removes future entries when replay moves backward", () => {
    const closed = evaluateTradeOnCandle(buyTrade(), candle(200, 1.1, 1.103, 1.0995, 1.102), settings);
    const future = { ...buyTrade(), id: "future", entryTime: 300 };
    const rewound = rewindTradesToTime([closed, future], 150);
    expect(rewound).toHaveLength(1);
    expect(rewound[0].status).toBe("open");
    expect(rewound[0].pnl).toBeUndefined();
  });

  it("calculates drawdown, profit factor and equity from closed trades", () => {
    const winner = evaluateTradeOnCandle(buyTrade(), candle(200, 1.1, 1.103, 1.0995, 1.102), settings);
    const loser = evaluateTradeOnCandle(buyTrade(), candle(300, 1.1, 1.1005, 1.098, 1.099), settings);
    const stats = calculateBacktestStats(1000, [winner, loser]);
    expect(stats.totalTrades).toBe(2);
    expect(stats.grossProfit).toBe(18.4);
    expect(stats.grossLoss).toBe(9.2);
    expect(stats.profitFactor).toBe(2);
    expect(stats.maxDrawdown).toBe(9.2);
    expect(stats.endingEquity).toBe(1009.2);
  });
});

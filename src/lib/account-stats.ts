// Mock data for the trading account overview (dashboard).

export const accountSummary = {
  gainPct: 1.01,
  gainAbsPct: 1.01,
  netPnl: 152.17,
  tradeCount: 23,
  winstreakDays: 1,
  winstreakDaysBest: 6,
  winstreakDaysWorst: 3,
  winstreakTrades: 2,
  winstreakTradesBest: 8,
  winstreakTradesWorst: 3,
  balance: 15152.17,
  balanceChangePct: 1.01,
};

export const riskStats = [
  { label: "Max Balance Drawdown", value: "271.55 € (1.80 %)", tone: "negative" as const },
  { label: "Max Equity Drawdown", value: "312.40 € (2.05 %)", tone: "negative" as const },
  { label: "Current equity", value: "15 152.17 €" },
  { label: "Current balance", value: "15 152.17 €" },
  { label: "Highest balance", value: "15 350.61 €" },
];

export const capitalFlows = [
  { label: "Deposits / Withdrawals", value: "15 000.00 € / 0.00 €" },
  { label: "Komisie & Swap", value: "11.52 € / -11.70 €", tone: "negative" as const },
  { label: "Celkovo lotov", value: "4.68" },
];

export const statisticsRows = [
  { label: "Profit Factor", value: "1.25", tone: "accent" as const },
  { label: "Expectancy", value: "6.62 €", tone: "accent" as const },
  { label: "Standard deviation", value: "79.63 €" },
  { label: "Sharpe Ratio", value: "0.09", tone: "accent" as const },
];

export const tradeStats = [
  { label: "Win rate (%)", value: "60.9 %", tone: "accent" as const },
  { label: "Profit Factor", value: "1.25", tone: "accent" as const },
  { label: "Priem. zisk / strata", value: "54.71 € / -68.20 €", tone: "negative" as const },
  { label: "Avg. trade length", value: "16h 16m" },
];

// Sparkline of trade count (last 14 days)
export const tradeCountSeries = [2, 1, 3, 6, 2, 1, 2, 1, 3, 1, 2, 4, 2, 3].map((v, i) => ({
  i,
  v,
}));

// Krivka balance
export const balanceSeries = (() => {
  const out: { d: string; v: number }[] = [];
  let v = 15000;
  const steps = [
    0, 40, 120, 95, -60, -140, -220, -180, -320, -120, 60, 240, 340, 300, 250, 180, 152,
  ];
  steps.forEach((s, i) => {
    v = 15000 + s;
    out.push({ d: `Jul ${i + 1}`, v: Math.round(v * 100) / 100 });
  });
  return out;
})();

export type CalendarDay = {
  day: number;
  pnl: number | null;
  trades: number;
};

// Trading calendar — July (P&L by day)
export const tradingCalendar: CalendarDay[] = (() => {
  const pnlByDay: Record<number, [number, number]> = {
    1: [42.1, 2],
    2: [-31.5, 1],
    3: [88.4, 3],
    7: [-64.2, 2],
    8: [24.9, 1],
    9: [113.6, 4],
    10: [-18.3, 1],
    14: [56.7, 2],
    15: [-92.4, 3],
    16: [37.2, 1],
    17: [71.5, 2],
    21: [-45.8, 2],
    22: [19.6, 1],
    23: [64.3, 2],
    24: [-27.1, 1],
    28: [48.9, 2],
    29: [-14.7, 1],
    30: [59.0, 2],
  };
  return Array.from({ length: 31 }, (_, i) => {
    const d = i + 1;
    const hit = pnlByDay[d];
    return { day: d, pnl: hit ? hit[0] : null, trades: hit ? hit[1] : 0 };
  });
})();

// July 1, 2026 is Wednesday -> index 2 (Mon=0)
export const calendarFirstWeekday = 2;
export const calendarMonthLabel = "July 2026";

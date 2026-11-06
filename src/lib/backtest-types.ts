export type BacktestSymbolId = "EURUSD" | "GBPUSD" | "USDJPY" | "EURJPY" | "XAUUSD" | "NASDAQ" | "US30";
export type BacktestTimeframe = "M1" | "M5" | "M15" | "M30" | "H1" | "H4" | "D1";
export type DataMode = "real" | "demo";

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export const BACKTEST_SYMBOLS = [
  { id: "EURUSD", label: "EUR / USD", yahoo: "EURUSD=X", digits: 5, pipSize: 0.0001, pipValueEur: 9.2, demoBase: 1.085, demoVolatility: 0.0007 },
  { id: "GBPUSD", label: "GBP / USD", yahoo: "GBPUSD=X", digits: 5, pipSize: 0.0001, pipValueEur: 9.2, demoBase: 1.285, demoVolatility: 0.0009 },
  { id: "USDJPY", label: "USD / JPY", yahoo: "USDJPY=X", digits: 3, pipSize: 0.01, pipValueEur: 6.2, demoBase: 151.2, demoVolatility: 0.09 },
  { id: "EURJPY", label: "EUR / JPY", yahoo: "EURJPY=X", digits: 3, pipSize: 0.01, pipValueEur: 6.2, demoBase: 164.1, demoVolatility: 0.1 },
  { id: "XAUUSD", label: "Gold / USD", yahoo: "GC=F", digits: 2, pipSize: 0.1, pipValueEur: 9.2, demoBase: 2740, demoVolatility: 2.4 },
  { id: "NASDAQ", label: "Nasdaq 100", yahoo: "^NDX", digits: 2, pipSize: 1, pipValueEur: 1, demoBase: 20500, demoVolatility: 28 },
  { id: "US30", label: "Dow Jones 30", yahoo: "^DJI", digits: 2, pipSize: 1, pipValueEur: 1, demoBase: 42500, demoVolatility: 48 },
] as const satisfies readonly {
  id: BacktestSymbolId;
  label: string;
  yahoo: string;
  digits: number;
  pipSize: number;
  pipValueEur: number;
  demoBase: number;
  demoVolatility: number;
}[];

export const BACKTEST_TIMEFRAMES = [
  { id: "M1", seconds: 60, yahoo: "1m", maxRangeDays: 7, maxPastDays: 30 },
  { id: "M5", seconds: 300, yahoo: "5m", maxRangeDays: 60, maxPastDays: 60 },
  { id: "M15", seconds: 900, yahoo: "15m", maxRangeDays: 60, maxPastDays: 60 },
  { id: "M30", seconds: 1800, yahoo: "30m", maxRangeDays: 60, maxPastDays: 60 },
  { id: "H1", seconds: 3600, yahoo: "1h", maxRangeDays: 730, maxPastDays: 730 },
  { id: "H4", seconds: 14400, yahoo: "1h", maxRangeDays: 730, maxPastDays: 730 },
  { id: "D1", seconds: 86400, yahoo: "1d", maxRangeDays: 3650, maxPastDays: 3650 },
] as const satisfies readonly {
  id: BacktestTimeframe;
  seconds: number;
  yahoo: string;
  maxRangeDays: number;
  maxPastDays: number;
}[];

export type RiskMode = "percent" | "fixed";

export type BacktestSettings = {
  startDate: string;
  endDate: string;
  initialCapital: number;
  riskMode: RiskMode;
  riskValue: number;
  spread: number;
  commission: number;
  slippage: number;
  autoSize: boolean;
};

export type Direction = "buy" | "sell";
export type CloseReason = "stop_loss" | "take_profit" | "manual";

export type SimulatedTrade = {
  id: string;
  symbol: BacktestSymbolId;
  direction: Direction;
  status: "open" | "closed";
  entryTime: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  riskEur: number;
  potentialEur: number;
  rr: number;
  commission: number;
  exitTime?: number;
  exitPrice?: number;
  pnl?: number;
  rMultiple?: number;
  closeReason?: CloseReason;
};

export type DrawingPoint = { time: number; price: number };
export type Drawing = {
  id: string;
  type: "trend" | "zone";
  from: DrawingPoint;
  to: DrawingPoint;
};

export type EquityPoint = { time: number; equity: number };

export type BacktestStats = {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number | null;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  averageR: number;
  averageWin: number;
  averageLoss: number;
  endingEquity: number;
  equityCurve: EquityPoint[];
};

export type BacktestHistoryResult = {
  symbol: BacktestSymbolId;
  timeframe: BacktestTimeframe;
  candles: Candle[];
  mode: DataMode;
  source: string;
  notice: string | null;
};

export type SavedBacktest = {
  id: string;
  name: string;
  symbol: BacktestSymbolId;
  timeframe: BacktestTimeframe;
  settings: BacktestSettings;
  trades: SimulatedTrade[];
  stats: BacktestStats;
  drawings: Drawing[];
  notes: string;
  replayIndex: number;
  dataMode: DataMode;
  updatedAt: string;
};

export function getSymbolMeta(symbol: BacktestSymbolId) {
  return BACKTEST_SYMBOLS.find((item) => item.id === symbol) ?? BACKTEST_SYMBOLS[0];
}

export function getTimeframeMeta(timeframe: BacktestTimeframe) {
  return BACKTEST_TIMEFRAMES.find((item) => item.id === timeframe) ?? BACKTEST_TIMEFRAMES[2];
}

export function formatPrice(value: number, symbol: BacktestSymbolId) {
  return value.toFixed(getSymbolMeta(symbol).digits);
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value);
}

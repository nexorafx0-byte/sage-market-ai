// Klientsky bezpečné typy a konštanty pre sezónnosť.

export type SeasonalPoint = {
  key: string; // MM-DD
  label: string; // 01 Jan
  dayIndex: number; // 1..365
  value: number; // priemerná kumulatívna zmena od začiatku roka (%)
  detrended: number; // po odstránení priemerného ročného driftu (%)
  years: number; // počet rokov v priemere
};

export type SeasonalityResult = {
  symbol: string;
  label: string;
  years: number;
  sampleYears: number;
  firstYear: number;
  lastYear: number;
  path: SeasonalPoint[];
  months: { month: string; value: number; positive: number; total: number }[];
  avgAnnual: number;
  source: string;
  updatedAt: string;
};

export const SEASONALITY_SYMBOLS = [
  { id: "XAUUSD", label: "XAUUSD (zlato)", yahoo: "GC=F" },
  { id: "XAGUSD", label: "XAGUSD (striebro)", yahoo: "SI=F" },
  { id: "EURUSD", label: "EURUSD", yahoo: "EURUSD=X" },
  { id: "GBPUSD", label: "GBPUSD", yahoo: "GBPUSD=X" },
  { id: "USDJPY", label: "USDJPY", yahoo: "USDJPY=X" },
  { id: "DXY", label: "DXY (dolárový index)", yahoo: "DX-Y.NYB" },
  { id: "WTI", label: "WTI ropa", yahoo: "CL=F" },
  { id: "SPX", label: "S&P 500", yahoo: "^GSPC" },
  { id: "NDX", label: "Nasdaq 100", yahoo: "^NDX" },
  { id: "BTCUSD", label: "BTCUSD", yahoo: "BTC-USD" },
] as const;

export const SEASONALITY_WINDOWS = [5, 10, 15, 20] as const;

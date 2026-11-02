// Client-safe types and constants for seasonality.

export type SeasonalPoint = {
  key: string; // MM-DD
  label: string; // 01 Jan
  dayIndex: number; // 1..365
  value: number; // average cumulative change since start of year (%)
  detrended: number; // after removing average annual drift (%)
  years: number; // number of years averaged
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
  yearly?: { year: number; closes: number[] }[];
  source: string;
  updatedAt: string;
};

export type SeasonalityGroup =
  | "USD pairs"
  | "EUR crosses"
  | "GBP crosses"
  | "JPY crosses"
  | "AUD / NZD / CAD crosses"
  | "Exotic pairs"
  | "Forex futures"
  | "Commodities"
  | "Indices"
  | "Krypto";

export const SEASONALITY_SYMBOLS = [
  // ---- USD pairs ----
  { id: "EURUSD", label: "EURUSD", yahoo: "EURUSD=X", group: "USD pairs" },
  { id: "GBPUSD", label: "GBPUSD", yahoo: "GBPUSD=X", group: "USD pairs" },
  { id: "USDJPY", label: "USDJPY", yahoo: "USDJPY=X", group: "USD pairs" },
  { id: "USDCHF", label: "USDCHF", yahoo: "USDCHF=X", group: "USD pairs" },
  { id: "USDCAD", label: "USDCAD", yahoo: "USDCAD=X", group: "USD pairs" },
  { id: "AUDUSD", label: "AUDUSD", yahoo: "AUDUSD=X", group: "USD pairs" },
  { id: "NZDUSD", label: "NZDUSD", yahoo: "NZDUSD=X", group: "USD pairs" },
  // ---- EUR crosses ----
  { id: "EURGBP", label: "EURGBP", yahoo: "EURGBP=X", group: "EUR crosses" },
  { id: "EURJPY", label: "EURJPY", yahoo: "EURJPY=X", group: "EUR crosses" },
  { id: "EURCHF", label: "EURCHF", yahoo: "EURCHF=X", group: "EUR crosses" },
  { id: "EURAUD", label: "EURAUD", yahoo: "EURAUD=X", group: "EUR crosses" },
  { id: "EURCAD", label: "EURCAD", yahoo: "EURCAD=X", group: "EUR crosses" },
  { id: "EURNZD", label: "EURNZD", yahoo: "EURNZD=X", group: "EUR crosses" },
  // ---- GBP crosses ----
  { id: "GBPJPY", label: "GBPJPY", yahoo: "GBPJPY=X", group: "GBP crosses" },
  { id: "GBPCHF", label: "GBPCHF", yahoo: "GBPCHF=X", group: "GBP crosses" },
  { id: "GBPAUD", label: "GBPAUD", yahoo: "GBPAUD=X", group: "GBP crosses" },
  { id: "GBPCAD", label: "GBPCAD", yahoo: "GBPCAD=X", group: "GBP crosses" },
  { id: "GBPNZD", label: "GBPNZD", yahoo: "GBPNZD=X", group: "GBP crosses" },
  // ---- JPY crosses ----
  { id: "AUDJPY", label: "AUDJPY", yahoo: "AUDJPY=X", group: "JPY crosses" },
  { id: "CADJPY", label: "CADJPY", yahoo: "CADJPY=X", group: "JPY crosses" },
  { id: "CHFJPY", label: "CHFJPY", yahoo: "CHFJPY=X", group: "JPY crosses" },
  { id: "NZDJPY", label: "NZDJPY", yahoo: "NZDJPY=X", group: "JPY crosses" },
  // ---- AUD / NZD / CAD crosses ----
  { id: "AUDNZD", label: "AUDNZD", yahoo: "AUDNZD=X", group: "AUD / NZD / CAD crosses" },
  { id: "AUDCAD", label: "AUDCAD", yahoo: "AUDCAD=X", group: "AUD / NZD / CAD crosses" },
  { id: "AUDCHF", label: "AUDCHF", yahoo: "AUDCHF=X", group: "AUD / NZD / CAD crosses" },
  { id: "NZDCAD", label: "NZDCAD", yahoo: "NZDCAD=X", group: "AUD / NZD / CAD crosses" },
  { id: "NZDCHF", label: "NZDCHF", yahoo: "NZDCHF=X", group: "AUD / NZD / CAD crosses" },
  { id: "CADCHF", label: "CADCHF", yahoo: "CADCHF=X", group: "AUD / NZD / CAD crosses" },
  // ---- Exotics ----
  { id: "USDMXN", label: "USDMXN", yahoo: "USDMXN=X", group: "Exotic pairs" },
  { id: "USDZAR", label: "USDZAR", yahoo: "USDZAR=X", group: "Exotic pairs" },
  { id: "USDSEK", label: "USDSEK", yahoo: "USDSEK=X", group: "Exotic pairs" },
  { id: "USDNOK", label: "USDNOK", yahoo: "USDNOK=X", group: "Exotic pairs" },
  { id: "USDTRY", label: "USDTRY", yahoo: "USDTRY=X", group: "Exotic pairs" },
  { id: "USDPLN", label: "USDPLN", yahoo: "USDPLN=X", group: "Exotic pairs" },
  // ---- Forex futures (CME) ----
  { id: "6E", label: "6E — Euro FX futures", yahoo: "6E=F", group: "Forex futures" },
  { id: "6B", label: "6B — British Pound futures", yahoo: "6B=F", group: "Forex futures" },
  { id: "6J", label: "6J — Japanese Yen futures", yahoo: "6J=F", group: "Forex futures" },
  { id: "6S", label: "6S — Swiss Franc futures", yahoo: "6S=F", group: "Forex futures" },
  { id: "6C", label: "6C — Canadian Dollar futures", yahoo: "6C=F", group: "Forex futures" },
  { id: "6A", label: "6A — Australian Dollar futures", yahoo: "6A=F", group: "Forex futures" },
  { id: "6N", label: "6N — New Zealand Dollar futures", yahoo: "6N=F", group: "Forex futures" },
  { id: "6M", label: "6M — Mexican Peso futures", yahoo: "6M=F", group: "Forex futures" },
  { id: "6L", label: "6L — Brazilian Real futures", yahoo: "6L=F", group: "Forex futures" },
  { id: "6Z", label: "6Z — South African Rand futures", yahoo: "6Z=F", group: "Forex futures" },
  { id: "DXFUT", label: "DX — Dollar Index futures", yahoo: "DX=F", group: "Forex futures" },
  // ---- Commodities ----
  { id: "XAUUSD", label: "XAUUSD (zlato)", yahoo: "GC=F", group: "Commodities" },
  { id: "XAGUSD", label: "XAGUSD (striebro)", yahoo: "SI=F", group: "Commodities" },
  { id: "XPTUSD", label: "XPTUSD (platina)", yahoo: "PL=F", group: "Commodities" },
  { id: "WTI", label: "WTI ropa", yahoo: "CL=F", group: "Commodities" },
  { id: "BRENT", label: "Brent ropa", yahoo: "BZ=F", group: "Commodities" },
  { id: "NATGAS", label: "Natural gas", yahoo: "NG=F", group: "Commodities" },
  { id: "COPPER", label: "Copper", yahoo: "HG=F", group: "Commodities" },
  { id: "WHEAT", label: "Wheat", yahoo: "ZW=F", group: "Commodities" },
  // ---- Indices ----
  { id: "DXY", label: "DXY (Dollar index)", yahoo: "DX-Y.NYB", group: "Indices" },
  { id: "SPX", label: "US500 (S&P 500)", yahoo: "^GSPC", group: "Indices" },
  { id: "NDX", label: "US100 (Nasdaq 100)", yahoo: "^NDX", group: "Indices" },
  { id: "DJI", label: "US30 (Dow Jones)", yahoo: "^DJI", group: "Indices" },
  { id: "RUT", label: "US2000 (Russell)", yahoo: "^RUT", group: "Indices" },
  { id: "DAX", label: "GER40 (DAX)", yahoo: "^GDAXI", group: "Indices" },
  { id: "FTSE", label: "UK100 (FTSE)", yahoo: "^FTSE", group: "Indices" },
  { id: "CAC", label: "FRA40 (CAC)", yahoo: "^FCHI", group: "Indices" },
  { id: "STOXX", label: "EU50 (Euro Stoxx)", yahoo: "^STOXX50E", group: "Indices" },
  { id: "NIKKEI", label: "JP225 (Nikkei)", yahoo: "^N225", group: "Indices" },
  { id: "HSI", label: "HK50 (Hang Seng)", yahoo: "^HSI", group: "Indices" },
  { id: "ASX", label: "AUS200 (ASX)", yahoo: "^AXJO", group: "Indices" },
  // ---- Krypto ----
  { id: "BTCUSD", label: "BTCUSD", yahoo: "BTC-USD", group: "Krypto" },
  { id: "ETHUSD", label: "ETHUSD", yahoo: "ETH-USD", group: "Krypto" },
] as const satisfies readonly {
  id: string;
  label: string;
  yahoo: string;
  group: SeasonalityGroup;
}[];

export const SEASONALITY_GROUPS: SeasonalityGroup[] = [
  "USD pairs",
  "EUR crosses",
  "GBP crosses",
  "JPY crosses",
  "AUD / NZD / CAD crosses",
  "Exotic pairs",
  "Forex futures",
  "Commodities",
  "Indices",
  "Krypto",
];

export const SEASONALITY_WINDOWS = [5, 10, 15, 20] as const;


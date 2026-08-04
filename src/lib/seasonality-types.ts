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

export type SeasonalityGroup =
  | "USD páry"
  | "EUR kríže"
  | "GBP kríže"
  | "JPY kríže"
  | "AUD / NZD / CAD kríže"
  | "Exotické páry"
  | "Komodity"
  | "Indexy"
  | "Krypto";

export const SEASONALITY_SYMBOLS = [
  // ---- USD páry ----
  { id: "EURUSD", label: "EURUSD", yahoo: "EURUSD=X", group: "USD páry" },
  { id: "GBPUSD", label: "GBPUSD", yahoo: "GBPUSD=X", group: "USD páry" },
  { id: "USDJPY", label: "USDJPY", yahoo: "USDJPY=X", group: "USD páry" },
  { id: "USDCHF", label: "USDCHF", yahoo: "USDCHF=X", group: "USD páry" },
  { id: "USDCAD", label: "USDCAD", yahoo: "USDCAD=X", group: "USD páry" },
  { id: "AUDUSD", label: "AUDUSD", yahoo: "AUDUSD=X", group: "USD páry" },
  { id: "NZDUSD", label: "NZDUSD", yahoo: "NZDUSD=X", group: "USD páry" },
  // ---- EUR kríže ----
  { id: "EURGBP", label: "EURGBP", yahoo: "EURGBP=X", group: "EUR kríže" },
  { id: "EURJPY", label: "EURJPY", yahoo: "EURJPY=X", group: "EUR kríže" },
  { id: "EURCHF", label: "EURCHF", yahoo: "EURCHF=X", group: "EUR kríže" },
  { id: "EURAUD", label: "EURAUD", yahoo: "EURAUD=X", group: "EUR kríže" },
  { id: "EURCAD", label: "EURCAD", yahoo: "EURCAD=X", group: "EUR kríže" },
  { id: "EURNZD", label: "EURNZD", yahoo: "EURNZD=X", group: "EUR kríže" },
  // ---- GBP kríže ----
  { id: "GBPJPY", label: "GBPJPY", yahoo: "GBPJPY=X", group: "GBP kríže" },
  { id: "GBPCHF", label: "GBPCHF", yahoo: "GBPCHF=X", group: "GBP kríže" },
  { id: "GBPAUD", label: "GBPAUD", yahoo: "GBPAUD=X", group: "GBP kríže" },
  { id: "GBPCAD", label: "GBPCAD", yahoo: "GBPCAD=X", group: "GBP kríže" },
  { id: "GBPNZD", label: "GBPNZD", yahoo: "GBPNZD=X", group: "GBP kríže" },
  // ---- JPY kríže ----
  { id: "AUDJPY", label: "AUDJPY", yahoo: "AUDJPY=X", group: "JPY kríže" },
  { id: "CADJPY", label: "CADJPY", yahoo: "CADJPY=X", group: "JPY kríže" },
  { id: "CHFJPY", label: "CHFJPY", yahoo: "CHFJPY=X", group: "JPY kríže" },
  { id: "NZDJPY", label: "NZDJPY", yahoo: "NZDJPY=X", group: "JPY kríže" },
  // ---- AUD / NZD / CAD kríže ----
  { id: "AUDNZD", label: "AUDNZD", yahoo: "AUDNZD=X", group: "AUD / NZD / CAD kríže" },
  { id: "AUDCAD", label: "AUDCAD", yahoo: "AUDCAD=X", group: "AUD / NZD / CAD kríže" },
  { id: "AUDCHF", label: "AUDCHF", yahoo: "AUDCHF=X", group: "AUD / NZD / CAD kríže" },
  { id: "NZDCAD", label: "NZDCAD", yahoo: "NZDCAD=X", group: "AUD / NZD / CAD kríže" },
  { id: "NZDCHF", label: "NZDCHF", yahoo: "NZDCHF=X", group: "AUD / NZD / CAD kríže" },
  { id: "CADCHF", label: "CADCHF", yahoo: "CADCHF=X", group: "AUD / NZD / CAD kríže" },
  // ---- Exotické ----
  { id: "USDMXN", label: "USDMXN", yahoo: "USDMXN=X", group: "Exotické páry" },
  { id: "USDZAR", label: "USDZAR", yahoo: "USDZAR=X", group: "Exotické páry" },
  { id: "USDSEK", label: "USDSEK", yahoo: "USDSEK=X", group: "Exotické páry" },
  { id: "USDNOK", label: "USDNOK", yahoo: "USDNOK=X", group: "Exotické páry" },
  { id: "USDTRY", label: "USDTRY", yahoo: "USDTRY=X", group: "Exotické páry" },
  { id: "USDPLN", label: "USDPLN", yahoo: "USDPLN=X", group: "Exotické páry" },
  // ---- Komodity ----
  { id: "XAUUSD", label: "XAUUSD (zlato)", yahoo: "GC=F", group: "Komodity" },
  { id: "XAGUSD", label: "XAGUSD (striebro)", yahoo: "SI=F", group: "Komodity" },
  { id: "XPTUSD", label: "XPTUSD (platina)", yahoo: "PL=F", group: "Komodity" },
  { id: "WTI", label: "WTI ropa", yahoo: "CL=F", group: "Komodity" },
  { id: "BRENT", label: "Brent ropa", yahoo: "BZ=F", group: "Komodity" },
  { id: "NATGAS", label: "Zemný plyn", yahoo: "NG=F", group: "Komodity" },
  { id: "COPPER", label: "Meď", yahoo: "HG=F", group: "Komodity" },
  { id: "WHEAT", label: "Pšenica", yahoo: "ZW=F", group: "Komodity" },
  // ---- Indexy ----
  { id: "DXY", label: "DXY (dolárový index)", yahoo: "DX-Y.NYB", group: "Indexy" },
  { id: "SPX", label: "US500 (S&P 500)", yahoo: "^GSPC", group: "Indexy" },
  { id: "NDX", label: "US100 (Nasdaq 100)", yahoo: "^NDX", group: "Indexy" },
  { id: "DJI", label: "US30 (Dow Jones)", yahoo: "^DJI", group: "Indexy" },
  { id: "RUT", label: "US2000 (Russell)", yahoo: "^RUT", group: "Indexy" },
  { id: "DAX", label: "GER40 (DAX)", yahoo: "^GDAXI", group: "Indexy" },
  { id: "FTSE", label: "UK100 (FTSE)", yahoo: "^FTSE", group: "Indexy" },
  { id: "CAC", label: "FRA40 (CAC)", yahoo: "^FCHI", group: "Indexy" },
  { id: "STOXX", label: "EU50 (Euro Stoxx)", yahoo: "^STOXX50E", group: "Indexy" },
  { id: "NIKKEI", label: "JP225 (Nikkei)", yahoo: "^N225", group: "Indexy" },
  { id: "HSI", label: "HK50 (Hang Seng)", yahoo: "^HSI", group: "Indexy" },
  { id: "ASX", label: "AUS200 (ASX)", yahoo: "^AXJO", group: "Indexy" },
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
  "USD páry",
  "EUR kríže",
  "GBP kríže",
  "JPY kríže",
  "AUD / NZD / CAD kríže",
  "Exotické páry",
  "Komodity",
  "Indexy",
  "Krypto",
];

export const SEASONALITY_WINDOWS = [5, 10, 15, 20] as const;


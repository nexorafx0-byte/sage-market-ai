// Ukážkové (mock) dáta pre UI prototyp Trading Analyzer AI.

export const currencyStrength = [
  { code: "USD", value: 82 },
  { code: "EUR", value: 46 },
  { code: "GBP", value: 61 },
  { code: "JPY", value: 24 },
  { code: "CHF", value: 55 },
  { code: "AUD", value: 38 },
  { code: "CAD", value: 49 },
  { code: "NZD", value: 31 },
];

// Fundament Score je v škále −10 až +10.
// Celkové skóre = priemer čiastkových skóre (sadzby, inflácia, rast, COT), zaokrúhlené na 1 desatinné miesto.
export type FundamentCategory = "Forex" | "Komodity" | "Indexy";

export type FundamentRow = {
  pair: string;
  category: FundamentCategory;
  score: number;
  bias: string;
  rate: string;
  infl: string;
  gdp: string;
  rateScore: number;
  inflScore: number;
  gdpScore: number;
  cotScore: number;
};

const bias = (s: number) => (s >= 2 ? "Bullish" : s <= -2 ? "Bearish" : "Neutrálny");

function row(
  pair: string,
  category: FundamentCategory,
  rate: string,
  infl: string,
  gdp: string,
  rateScore: number,
  inflScore: number,
  gdpScore: number,
  cotScore: number,
): FundamentRow {
  const score = Math.round(((rateScore + inflScore + gdpScore + cotScore) / 4) * 10) / 10;
  return { pair, category, score, bias: bias(score), rate, infl, gdp, rateScore, inflScore, gdpScore, cotScore };
}

export const fundamentScore: FundamentRow[] = [
  // ---- Forex: majors ----
  row("EURUSD", "Forex", "4.15 %", "2.1 %", "0.3 %", -4, -3, -3, -3.5),
  row("GBPUSD", "Forex", "4.75 %", "2.8 %", "0.5 %", -1, -2, 0, -2),
  row("USDJPY", "Forex", "0.50 %", "3.0 %", "0.1 %", 8, 4, 5, 6),
  row("USDCHF", "Forex", "0.25 %", "1.1 %", "0.4 %", 6, 3, 2, 3),
  row("USDCAD", "Forex", "2.75 %", "2.0 %", "0.6 %", 3, 2, 1, 2.5),
  row("AUDUSD", "Forex", "3.60 %", "2.4 %", "0.2 %", -5, -3, -4, -4.5),
  row("NZDUSD", "Forex", "3.25 %", "2.2 %", "0.1 %", -4, -3, -5, -3),
  // ---- Forex: crosses ----
  row("EURGBP", "Forex", "4.15 / 4.75 %", "2.1 / 2.8 %", "0.3 / 0.5 %", -3, -1, -2, -1.5),
  row("EURJPY", "Forex", "4.15 / 0.50 %", "2.1 / 3.0 %", "0.3 / 0.1 %", 5, 2, 3, 4),
  row("EURCHF", "Forex", "4.15 / 0.25 %", "2.1 / 1.1 %", "0.3 / 0.4 %", 3, 1, 0, 1),
  row("EURAUD", "Forex", "4.15 / 3.60 %", "2.1 / 2.4 %", "0.3 / 0.2 %", 2, 1, 2, 3),
  row("EURCAD", "Forex", "4.15 / 2.75 %", "2.1 / 2.0 %", "0.3 / 0.6 %", 2, 0, -1, 1),
  row("EURNZD", "Forex", "4.15 / 3.25 %", "2.1 / 2.2 %", "0.3 / 0.1 %", 3, 1, 3, 2),
  row("GBPJPY", "Forex", "4.75 / 0.50 %", "2.8 / 3.0 %", "0.5 / 0.1 %", 6, 3, 4, 5),
  row("GBPCHF", "Forex", "4.75 / 0.25 %", "2.8 / 1.1 %", "0.5 / 0.4 %", 4, 2, 1, 2),
  row("GBPAUD", "Forex", "4.75 / 3.60 %", "2.8 / 2.4 %", "0.5 / 0.2 %", 3, 2, 3, 3.5),
  row("GBPCAD", "Forex", "4.75 / 2.75 %", "2.8 / 2.0 %", "0.5 / 0.6 %", 3, 1, 0, 1.5),
  row("GBPNZD", "Forex", "4.75 / 3.25 %", "2.8 / 2.2 %", "0.5 / 0.1 %", 4, 2, 4, 3),
  row("AUDJPY", "Forex", "3.60 / 0.50 %", "2.4 / 3.0 %", "0.2 / 0.1 %", 4, 1, 1, 2.5),
  row("AUDNZD", "Forex", "3.60 / 3.25 %", "2.4 / 2.2 %", "0.2 / 0.1 %", 1, 0, 1, 1),
  row("AUDCAD", "Forex", "3.60 / 2.75 %", "2.4 / 2.0 %", "0.2 / 0.6 %", 1, -1, -2, -1),
  row("CADJPY", "Forex", "2.75 / 0.50 %", "2.0 / 3.0 %", "0.6 / 0.1 %", 5, 2, 3, 3.5),
  row("CHFJPY", "Forex", "0.25 / 0.50 %", "1.1 / 3.0 %", "0.4 / 0.1 %", 2, 3, 2, 2),
  row("NZDJPY", "Forex", "3.25 / 0.50 %", "2.2 / 3.0 %", "0.1 / 0.1 %", 4, 1, 0, 2),
  row("USDMXN", "Forex", "9.00 %", "4.2 %", "0.2 %", -2, 1, 2, 1.5),
  row("USDZAR", "Forex", "7.25 %", "4.8 %", "0.3 %", -1, 2, 3, 2),
  row("USDSEK", "Forex", "1.75 %", "1.9 %", "0.4 %", 5, 2, 2, 3),
  row("USDNOK", "Forex", "4.25 %", "2.9 %", "0.5 %", 2, 1, -1, 0.5),
  // ---- Komodity ----
  row("XAUUSD", "Komodity", "—", "—", "—", 1, 3, 2, 5),
  row("XAGUSD", "Komodity", "—", "—", "—", 1, 4, 3, 4),
  row("XPTUSD", "Komodity", "—", "—", "—", 0, 2, 1, 2),
  row("WTI (US Oil)", "Komodity", "—", "—", "—", -2, 1, -3, 3),
  row("BRENT", "Komodity", "—", "—", "—", -2, 1, -2, 2.5),
  row("NATGAS", "Komodity", "—", "—", "—", -1, 2, -4, -3),
  row("COPPER", "Komodity", "—", "—", "—", -1, 0, -3, -2),
  row("WHEAT", "Komodity", "—", "—", "—", 0, 1, -1, -2),
  // ---- Indexy ----
  row("US500 (S&P 500)", "Indexy", "4.15 %", "2.1 %", "2.4 %", -2, 1, 5, 4),
  row("US100 (Nasdaq)", "Indexy", "4.15 %", "2.1 %", "2.4 %", -3, 1, 6, 5),
  row("US30 (Dow)", "Indexy", "4.15 %", "2.1 %", "2.4 %", -2, 1, 4, 3),
  row("US2000 (Russell)", "Indexy", "4.15 %", "2.1 %", "2.4 %", -4, 0, 2, 1),
  row("GER40 (DAX)", "Indexy", "2.15 %", "2.2 %", "0.3 %", 2, 1, -2, 1),
  row("UK100 (FTSE)", "Indexy", "4.75 %", "2.8 %", "0.5 %", -1, 0, 0, 1),
  row("FRA40 (CAC)", "Indexy", "2.15 %", "2.0 %", "0.2 %", 2, 1, -2, 0),
  row("EU50 (Euro Stoxx)", "Indexy", "2.15 %", "2.1 %", "0.3 %", 2, 1, -1, 1),
  row("JP225 (Nikkei)", "Indexy", "0.50 %", "3.0 %", "0.9 %", 4, -1, 3, 3),
  row("HK50 (Hang Seng)", "Indexy", "3.10 %", "1.2 %", "4.7 %", 0, 2, 3, -1),
  row("AUS200 (ASX)", "Indexy", "3.60 %", "2.4 %", "0.2 %", -1, 0, -1, 0),
  row("US_DXY (Dolár index)", "Indexy", "4.15 %", "2.1 %", "2.4 %", 5, 3, 4, 5),
];



export const cotData = [
  { asset: "EUR", net: -34120, change: -4210, extreme: 18 },
  { asset: "GBP", net: 12450, change: 2310, extreme: 62 },
  { asset: "JPY", net: -88400, change: 9120, extreme: 8 },
  { asset: "GOLD", net: 210300, change: 14800, extreme: 91 },
  { asset: "OIL", net: 154900, change: -6200, extreme: 47 },
];

export const seasonality = [
  { month: "Jan", value: 0.8 },
  { month: "Feb", value: -0.4 },
  { month: "Mar", value: 1.6 },
  { month: "Apr", value: 2.1 },
  { month: "Máj", value: -1.2 },
  { month: "Jún", value: -0.6 },
  { month: "Júl", value: 1.1 },
  { month: "Aug", value: -1.9 },
  { month: "Sep", value: -2.4 },
  { month: "Okt", value: 0.9 },
  { month: "Nov", value: 2.6 },
  { month: "Dec", value: 1.4 },
];

export const equityCurve = [
  { d: "01", v: 100000 },
  { d: "04", v: 101250 },
  { d: "07", v: 100480 },
  { d: "10", v: 102900 },
  { d: "13", v: 104150 },
  { d: "16", v: 103200 },
  { d: "19", v: 106400 },
  { d: "22", v: 108950 },
  { d: "25", v: 108100 },
  { d: "28", v: 111700 },
];

export const newsFeed = [
  {
    time: "14:30",
    impact: "high" as const,
    currency: "USD",
    title: "Core CPI m/m",
    forecast: "0.3 %",
    previous: "0.2 %",
    ai: "Vyššie CPI podporí USD; pri EURUSD očakávaj test 1.0720 a rozšírené spready 5 min pred vydaním.",
  },
  {
    time: "16:00",
    impact: "medium" as const,
    currency: "EUR",
    title: "ECB Lane prejav",
    forecast: "—",
    previous: "—",
    ai: "Holubičí tón by potvrdil krátku fundamentálnu tézu na EUR.",
  },
  {
    time: "20:00",
    impact: "high" as const,
    currency: "USD",
    title: "FOMC zápisnica",
    forecast: "—",
    previous: "—",
    ai: "Zníž veľkosť pozície o 50 % do vydania — historicky priemerný rozsah 78 pipov.",
  },
];

export const supplyDemandZones = [
  { pair: "EURUSD", tf: "H4", type: "Supply", from: "1.0865", to: "1.0902", score: 88, status: "Fresh" },
  { pair: "EURUSD", tf: "H1", type: "Demand", from: "1.0688", to: "1.0712", score: 74, status: "Fresh" },
  { pair: "USDJPY", tf: "D1", type: "Supply", from: "158.20", to: "159.10", score: 65, status: "Tested 1x" },
  { pair: "XAUUSD", tf: "H4", type: "Demand", from: "2 318", to: "2 331", score: 81, status: "Fresh" },
];

export const journalEntries = [
  {
    date: "12. 07.",
    pair: "EURUSD",
    side: "Short",
    r: -1,
    emotion: "Netrpezlivosť",
    ai: "Vstup 12 minút pred CPI bez potvrdenia. Opakovaný vzorec: 4 z 5 stratových obchodov vzniklo pred správou s vysokým dopadom.",
  },
  {
    date: "15. 07.",
    pair: "XAUUSD",
    side: "Long",
    r: 2.4,
    emotion: "Pokoj",
    ai: "Čistá exekúcia podľa plánu — demand zóna H4 + slabý USD index. Toto je tvoj najziskovejší setup (avg +1.9R).",
  },
  {
    date: "18. 07.",
    pair: "GBPUSD",
    side: "Long",
    r: 0.6,
    emotion: "Chamtivosť",
    ai: "Posun SL do BE bol správny, ale skoré ukončenie ťa stálo 1.3R. Zvýš čas držania pri trende D1.",
  },
];

export const fundedAccounts = [
  { name: "FTMO 100k", phase: "Funded", balance: 111700, dd: 3.2, ddMax: 10, target: 68, profit: 11700 },
  { name: "FundingPips 50k", phase: "Fáza 2", balance: 52340, dd: 1.4, ddMax: 8, target: 47, profit: 2340 },
  { name: "The5ers 20k", phase: "Fáza 1", balance: 20480, dd: 4.9, ddMax: 6, target: 24, profit: 480 },
];

export const backtests = [
  { name: "London Open — S&D", trades: 214, winrate: 58, pf: 1.84, dd: 6.2, expectancy: 0.41 },
  { name: "COT Extreme reversal", trades: 96, winrate: 47, pf: 2.31, dd: 9.8, expectancy: 0.72 },
  { name: "Sezónnosť XAU november", trades: 41, winrate: 66, pf: 2.05, dd: 4.1, expectancy: 0.63 },
];

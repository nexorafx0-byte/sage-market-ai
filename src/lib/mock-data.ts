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

export const fundamentScore = [
  { pair: "EURUSD", score: -34, bias: "Bearish", rate: "4.15 %", infl: "2.1 %", gdp: "0.3 %" },
  { pair: "GBPUSD", score: -12, bias: "Neutrálny", rate: "4.75 %", infl: "2.8 %", gdp: "0.5 %" },
  { pair: "USDJPY", score: 58, bias: "Bullish", rate: "0.50 %", infl: "3.0 %", gdp: "0.1 %" },
  { pair: "AUDUSD", score: -41, bias: "Bearish", rate: "3.60 %", infl: "2.4 %", gdp: "0.2 %" },
  { pair: "XAUUSD", score: 27, bias: "Bullish", rate: "—", infl: "—", gdp: "—" },
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

// Deterministické detailné dáta pre jeden inštrument (zdroje makra + COT história).
import type { FundamentRow } from "./mock-data";

export type CotWeek = {
  date: string;
  longChange: number;
  longPct: number;
  longOi: number;
  openInterest: number;
  shortOi: number;
  shortPct: number;
  shortChange: number;
  net: number;
};

export type MacroSource = {
  label: string;
  value: string;
  score: number;
  source: string;
  updated: string;
  note: string;
};

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const WEEK_DATES = [
  "27 Júl 2026",
  "20 Júl 2026",
  "13 Júl 2026",
  "06 Júl 2026",
  "29 Jún 2026",
  "22 Jún 2026",
];

/** COT história (Noncommercial positions) – 6 týždňov, formát ako reporty CFTC. */
export function cotHistory(row: FundamentRow): CotWeek[] {
  const rand = seeded(hash(row.pair + "cot"));
  const base = 30000 + Math.round(rand() * 40000);
  // bias podľa COT skóre: kladné = viac longov
  const tilt = 0.5 + (row.cotScore / 10) * 0.12;

  const out: CotWeek[] = [];
  let longOi = Math.round(base * tilt * (0.95 + rand() * 0.1));
  let shortOi = Math.round(base * (1 - tilt) * (0.95 + rand() * 0.1));

  for (let i = 0; i < WEEK_DATES.length; i++) {
    const longChange = Math.round((rand() - 0.45) * 3500);
    const shortChange = Math.round((rand() - 0.5) * 3000);
    const openInterest = longOi + shortOi + Math.round(rand() * 6000);
    const total = longOi + shortOi;
    out.push({
      date: WEEK_DATES[i],
      longChange,
      longPct: Math.round((longOi / total) * 10000) / 100,
      longOi,
      openInterest,
      shortOi,
      shortPct: Math.round((shortOi / total) * 10000) / 100,
      shortChange,
      net: longOi - shortOi,
    });
    longOi = Math.max(1000, longOi - longChange);
    shortOi = Math.max(1000, shortOi - shortChange);
  }
  return out;
}

function bankFor(pair: string) {
  if (pair.startsWith("EUR")) return "ECB";
  if (pair.startsWith("GBP")) return "Bank of England";
  if (pair.startsWith("USD") || pair.includes("US")) return "Federal Reserve";
  if (pair.startsWith("JPY")) return "Bank of Japan";
  if (pair.startsWith("AUD")) return "RBA";
  if (pair.startsWith("NZD")) return "RBNZ";
  if (pair.startsWith("CAD")) return "Bank of Canada";
  if (pair.startsWith("CHF")) return "SNB";
  return "Centrálna banka (hlavná mena)";
}

/** Rozpis makro faktorov so zdrojom dát. */
export function macroSources(row: FundamentRow): MacroSource[] {
  return [
    {
      label: "Úroková sadzba",
      value: row.rate,
      score: row.rateScore,
      source: bankFor(row.pair),
      updated: "24. júl 2026",
      note: "Aktuálna kľúčová sadzba a očakávaná trajektória (OIS krivka).",
    },
    {
      label: "Inflácia (CPI, r/r)",
      value: row.infl,
      score: row.inflScore,
      source: "Národný štatistický úrad / Eurostat / BLS",
      updated: "15. júl 2026",
      note: "Jadrová aj celková inflácia vs. cieľ centrálnej banky.",
    },
    {
      label: "Rast HDP (q/q)",
      value: row.gdp,
      score: row.gdpScore,
      source: "OECD / národné účty",
      updated: "30. jún 2026",
      note: "Tempo rastu ekonomiky a revízie predchádzajúcich období.",
    },
    {
      label: "COT pozície",
      value: `${row.cotScore > 0 ? "+" : ""}${row.cotScore}`,
      score: row.cotScore,
      source: "CFTC — Commitments of Traders (Noncommercial)",
      updated: "27. júl 2026",
      note: "Netto pozícia veľkých špekulantov a jej týždenná zmena.",
    },
  ];
}

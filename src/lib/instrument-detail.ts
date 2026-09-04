// Deterministic detail data for a single instrument (macro sources + COT history).
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
  "27 Jul 2026",
  "20 Jul 2026",
  "13 Jul 2026",
  "06 Jul 2026",
  "29 Jun 2026",
  "22 Jun 2026",
];

export type CotGroup = "noncommercial" | "commercial" | "retail";

export const COT_GROUPS: {
  key: CotGroup;
  label: string;
  desc: string;
  source: string;
}[] = [
  {
    key: "noncommercial",
    label: "Non-Commercial",
    desc: "Large speculators (hedge funds, CTAs) — trend-following money.",
    source: "CFTC — Legacy report, Noncommercial positions",
  },
  {
    key: "commercial",
    label: "Commercial",
    desc: "Hedgers and producers — hedging, usually against the trend.",
    source: "CFTC — Legacy report, Commercial positions",
  },
  {
    key: "retail",
    label: "Retail",
    desc: "Small traders (non-reportable + broker sentiment).",
    source: "CFTC Non-reportable + retail sentiment brokerov",
  },
];

/** COT history for a group - 6 weeks, in CFTC report format. */
export function cotHistory(row: FundamentRow, group: CotGroup = "noncommercial"): CotWeek[] {
  const rand = seeded(hash(row.pair + group));
  const sizeFactor = group === "noncommercial" ? 1 : group === "commercial" ? 1.15 : 0.35;
  const base = (30000 + Math.round(rand() * 40000)) * sizeFactor;

  // bias by COT score: non-commercial follows the trend, commercial and retail go against it
  const dir = group === "noncommercial" ? 1 : group === "commercial" ? -1 : -0.8;
  const tilt = 0.5 + ((row.cotScore * dir) / 10) * 0.12;

  const out: CotWeek[] = [];
  let longOi = Math.round(base * tilt * (0.95 + rand() * 0.1));
  let shortOi = Math.round(base * (1 - tilt) * (0.95 + rand() * 0.1));

  for (let i = 0; i < WEEK_DATES.length; i++) {
    const longChange = Math.round((rand() - 0.45) * 3500 * sizeFactor);
    const shortChange = Math.round((rand() - 0.5) * 3000 * sizeFactor);
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
  return "Central bank (major currency)";
}

/** Breakdown of macro factors with data source. */
export function macroSources(row: FundamentRow): MacroSource[] {
  return [
    {
      label: "Interest rate",
      value: row.rate,
      score: row.rateScore,
      source: bankFor(row.pair),
      updated: "24. Jul 2026",
      note: "Current policy rate and expected path (OIS curve).",
    },
    {
      label: "Inflation (CPI, y/y)",
      value: row.infl,
      score: row.inflScore,
      source: "National statistics office / Eurostat / BLS",
      updated: "15. Jul 2026",
      note: "Core and headline inflation vs. the central bank target.",
    },
    {
      label: "Rast HDP (q/q)",
      value: row.gdp,
      score: row.gdpScore,
      source: "OECD / national accounts",
      updated: "30. Jun 2026",
      note: "Economic growth pace and revisions of previous periods.",
    },
    {
      label: "COT positioning",
      value: `${row.cotScore > 0 ? "+" : ""}${row.cotScore}`,
      score: row.cotScore,
      source: "CFTC — Commitments of Traders (Noncommercial)",
      updated: "27. Jul 2026",
      note: "Net position of large speculators and its weekly change.",
    },
  ];
}

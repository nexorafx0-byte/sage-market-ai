// Real market data: CFTC (COT), BIS (central bank rates),
// World Bank (inflation, GDP), Yahoo Finance (prices -> seasonality, S&D zones).
// Optionally FRED (if a valid FRED_API_KEY is set) for monthly US inflation.

import type { FundamentCategory, FundamentRow } from "./mock-data";
import type {
  CotWeekReal,
  InstrumentDetailReal,
  MarketAnalysis,
  MacroSourceReal,
} from "./market-types";

export type { CotWeekReal, InstrumentDetailReal, MarketAnalysis, MacroSourceReal };


const SK_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dec",
];

const clamp = (v: number, lo = -10, hi = 10) => Math.max(lo, Math.min(hi, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")} ${SK_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

async function getJson<T>(url: string, headers?: Record<string, string>): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "TradingAnalyzerAI/1.0", ...(headers ?? {}) },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Meta                                                                */
/* ------------------------------------------------------------------ */

type Ccy = "USD" | "EUR" | "GBP" | "JPY" | "CHF" | "AUD" | "CAD" | "NZD";

const CCY: Record<Ccy, { bis: string; wb: string; cot: string; bank: string }> = {
  USD: { bis: "US", wb: "USA", cot: "098662", bank: "Federal Reserve" },
  EUR: { bis: "XM", wb: "EMU", cot: "099741", bank: "ECB" },
  GBP: { bis: "GB", wb: "GBR", cot: "096742", bank: "Bank of England" },
  JPY: { bis: "JP", wb: "JPN", cot: "097741", bank: "Bank of Japan" },
  CHF: { bis: "CH", wb: "CHE", cot: "092741", bank: "SNB" },
  AUD: { bis: "AU", wb: "AUS", cot: "232741", bank: "RBA" },
  CAD: { bis: "CA", wb: "CAN", cot: "090741", bank: "Bank of Canada" },
  NZD: { bis: "NZ", wb: "NZL", cot: "112741", bank: "RBNZ" },
};

const FX_PAIRS: [Ccy, Ccy][] = [
  ["EUR", "USD"],
  ["GBP", "USD"],
  ["USD", "JPY"],
  ["USD", "CHF"],
  ["USD", "CAD"],
  ["AUD", "USD"],
  ["NZD", "USD"],
  ["EUR", "GBP"],
  ["EUR", "JPY"],
  ["EUR", "CHF"],
  ["EUR", "AUD"],
  ["EUR", "CAD"],
  ["EUR", "NZD"],
  ["GBP", "JPY"],
  ["GBP", "CHF"],
  ["GBP", "AUD"],
  ["GBP", "CAD"],
  ["GBP", "NZD"],
  ["AUD", "JPY"],
  ["AUD", "NZD"],
  ["AUD", "CAD"],
  ["CAD", "JPY"],
  ["CHF", "JPY"],
  ["NZD", "JPY"],
];

const NON_FX: {
  pair: string;
  cot: string;
  category: FundamentCategory;
  kind: "commodity" | "index";
}[] = [
  { pair: "XAUUSD", cot: "088691", category: "Commodities", kind: "commodity" },
  { pair: "XAGUSD", cot: "084691", category: "Commodities", kind: "commodity" },
  { pair: "XPTUSD", cot: "076651", category: "Commodities", kind: "commodity" },
  { pair: "COPPER", cot: "085692", category: "Commodities", kind: "commodity" },
  { pair: "WTI (US Oil)", cot: "067651", category: "Commodities", kind: "commodity" },
  { pair: "NATGAS", cot: "023651", category: "Commodities", kind: "commodity" },
  { pair: "WHEAT", cot: "001602", category: "Commodities", kind: "commodity" },
  { pair: "US500 (S&P 500)", cot: "13874A", category: "Indices", kind: "index" },
  { pair: "US100 (Nasdaq)", cot: "209742", category: "Indices", kind: "index" },
  { pair: "US30 (Dow)", cot: "124603", category: "Indices", kind: "index" },
  { pair: "US2000 (Russell)", cot: "239742", category: "Indices", kind: "index" },
  { pair: "BTCUSD", cot: "133741", category: "Commodities", kind: "commodity" },
  { pair: "US_DXY (Dollar index)", cot: "098662", category: "Indices", kind: "index" },
];

/* ------------------------------------------------------------------ */
/* CFTC — Commitments of Traders                                       */
/* ------------------------------------------------------------------ */

type CotRow = {
  code: string;
  date: string;
  oi: number;
  nc: { l: number; s: number };
  cm: { l: number; s: number };
  rt: { l: number; s: number };
};

async function fetchCot(codes: string[]): Promise<Map<string, CotRow[]>> {
  const inList = codes.map((c) => `'${c}'`).join(",");
  const fields = [
    "cftc_contract_market_code",
    "report_date_as_yyyy_mm_dd",
    "open_interest_all",
    "noncomm_positions_long_all",
    "noncomm_positions_short_all",
    "comm_positions_long_all",
    "comm_positions_short_all",
    "nonrept_positions_long_all",
    "nonrept_positions_short_all",
  ].join(",");
  const url =
    "https://publicreporting.cftc.gov/resource/6dca-aqww.json" +
    `?$select=${fields}` +
    `&$where=${encodeURIComponent(`cftc_contract_market_code in (${inList})`)}` +
    "&$order=report_date_as_yyyy_mm_dd%20DESC&$limit=6000";

  const raw = await getJson<Record<string, string>[]>(url);
  const map = new Map<string, CotRow[]>();
  if (!raw) return map;

  const n = (v?: string) => Number(v ?? 0) || 0;
  for (const row of raw) {
    const code = row["cftc_contract_market_code"];
    const item: CotRow = {
      code,
      date: row["report_date_as_yyyy_mm_dd"],
      oi: n(row["open_interest_all"]),
      nc: { l: n(row["noncomm_positions_long_all"]), s: n(row["noncomm_positions_short_all"]) },
      cm: { l: n(row["comm_positions_long_all"]), s: n(row["comm_positions_short_all"]) },
      rt: { l: n(row["nonrept_positions_long_all"]), s: n(row["nonrept_positions_short_all"]) },
    };
    const arr = map.get(code) ?? [];
    arr.push(item);
    map.set(code, arr);
  }
  for (const arr of map.values()) arr.sort((a, b) => (a.date < b.date ? 1 : -1));
  return map;
}

function cotWeeks(rows: CotRow[], group: "noncommercial" | "commercial" | "retail"): CotWeekReal[] {
  const pick = (r: CotRow) => (group === "noncommercial" ? r.nc : group === "commercial" ? r.cm : r.rt);
  return rows.slice(0, 6).map((r, i) => {
    const cur = pick(r);
    const prev = rows[i + 1] ? pick(rows[i + 1]) : cur;
    const total = cur.l + cur.s || 1;
    return {
      date: fmtDate(r.date),
      longChange: cur.l - prev.l,
      longPct: Math.round((cur.l / total) * 10000) / 100,
      longOi: cur.l,
      openInterest: r.oi,
      shortOi: cur.s,
      shortPct: Math.round((cur.s / total) * 10000) / 100,
      shortChange: cur.s - prev.s,
      net: cur.l - cur.s,
    };
  });
}

/** Non-commercial net position as % of open interest + percentile over available history. */
function cotStats(rows: CotRow[] | undefined) {
  if (!rows || rows.length === 0) return null;
  const nets = rows.map((r) => r.nc.l - r.nc.s);
  const latest = nets[0];
  const prev = nets[1] ?? latest;
  const sorted = [...nets].sort((a, b) => a - b);
  const rank = sorted.filter((v) => v <= latest).length;
  return {
    net: latest,
    change: latest - prev,
    pctOfOi: rows[0].oi ? latest / rows[0].oi : 0,
    percentile: Math.round((rank / sorted.length) * 100),
    date: rows[0].date,
  };
}

/* ------------------------------------------------------------------ */
/* BIS — central bank rates                                       */
/* ------------------------------------------------------------------ */

async function fetchPolicyRates(): Promise<Record<string, number>> {
  const areas = Object.values(CCY).map((c) => c.bis).join("+");
  const url = `https://stats.bis.org/api/v2/data/dataflow/BIS/WS_CBPOL/1.0/M.${areas}?lastNObservations=1`;
  const data = await getJson<any>(url, {
    Accept: "application/vnd.sdmx.data+json;version=1.0.0",
  });
  const out: Record<string, number> = {};
  try {
    const dims = data.data.structure.dimensions.series;
    const refIdx = dims.findIndex((d: any) => d.id === "REF_AREA");
    const values = dims[refIdx].values.map((v: any) => v.id as string);
    const series = data.data.dataSets[0].series as Record<string, any>;
    for (const [key, val] of Object.entries(series)) {
      const parts = key.split(":").map(Number);
      const area = values[parts[refIdx]];
      const obs = Object.values(val.observations)[0] as any[];
      out[area] = Number(obs[0]);
    }
  } catch {
    /* empty = fallback */
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* World Bank — inflation and GDP growth                                    */
/* ------------------------------------------------------------------ */

async function fetchWorldBank(indicator: string): Promise<Record<string, { v: number; year: string }>> {
  const out: Record<string, { v: number; year: string }> = {};
  const isos = Object.values(CCY).map((c) => c.wb);

  for (const iso of isos) {
    const url = `https://api.worldbank.org/v2/country/${iso}/indicator/${indicator}?format=json&per_page=10&mrv=4`;
    let data = await getJson<any[]>(url);
    if (!Array.isArray(data) || !Array.isArray(data[1])) data = await getJson<any[]>(url);
    if (!Array.isArray(data) || !Array.isArray(data[1])) continue;
    for (const row of data[1]) {
      if (row.value == null) continue;
      const existing = out[iso];
      if (!existing || row.date > existing.year)
        out[iso] = { v: row.value as number, year: row.date };
    }
  }
  return out;
}



/** Monthly US inflation from FRED, if a valid key is available. */
async function fetchFredCpi(): Promise<{ v: number; date: string } | null> {
  const key = process.env["FRED_API_KEY"];
  if (!key) return null;
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&units=pc1&api_key=${key}&file_type=json&sort_order=desc&limit=1`;
  const data = await getJson<any>(url);
  const obs = data?.observations?.[0];
  if (!obs || obs.value === ".") return null;
  return { v: Number(obs.value), date: obs.date };
}

/* ------------------------------------------------------------------ */
/* Yahoo Finance — ceny                                                */
/* ------------------------------------------------------------------ */

type Bar = { t: number; o: number; h: number; l: number; c: number };

async function fetchBars(symbol: string, range: string, interval: string): Promise<Bar[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const data = await getJson<any>(url);
  const res = data?.chart?.result?.[0];
  if (!res) return [];
  const q = res.indicators.quote[0];
  const out: Bar[] = [];
  (res.timestamp as number[]).forEach((t, i) => {
    if (q.close[i] == null || q.open[i] == null) return;
    out.push({ t, o: q.open[i], h: q.high[i], l: q.low[i], c: q.close[i] });
  });
  return out;
}

function seasonalityFrom(bars: Bar[]) {
  const buckets: number[][] = Array.from({ length: 12 }, () => []);
  for (let i = 1; i < bars.length; i++) {
    const m = new Date(bars[i].t * 1000).getUTCMonth();
    buckets[m].push(((bars[i].c - bars[i - 1].c) / bars[i - 1].c) * 100);
  }
  return SK_MONTHS.map((month, i) => ({
    month,
    value:
      buckets[i].length > 0
        ? Math.round((buckets[i].reduce((a, b) => a + b, 0) / buckets[i].length) * 100) / 100
        : 0,
  }));
}

function zonesFrom(bars: Bar[], pair: string, digits: number) {
  const look = 5;
  const out: MarketAnalysis["zones"] = [];
  const last = bars[bars.length - 1]?.c ?? 0;
  for (let i = bars.length - look - 1; i >= look && out.length < 2; i--) {
    const c = bars[i];
    const left = bars.slice(i - look, i);
    const right = bars.slice(i + 1, i + 1 + look);
    const isHigh = left.every((x) => x.h < c.h) && right.every((x) => x.h < c.h);
    const isLow = left.every((x) => x.l > c.l) && right.every((x) => x.l > c.l);
    if (!isHigh && !isLow) continue;
    const from = isHigh ? Math.max(c.o, c.c) : c.l;
    const to = isHigh ? c.h : Math.min(c.o, c.c);
    const tested = bars.slice(i + 1).some((x) => x.h >= from && x.l <= to);
    const dist = Math.abs(((isHigh ? to : from) - last) / last) * 100;
    out.push({
      pair,
      tf: "D1",
      type: isHigh ? "Supply" : "Demand",
      from: from.toFixed(digits),
      to: to.toFixed(digits),
      score: Math.max(35, Math.round(95 - dist * 6 - (tested ? 20 : 0))),
      status: tested ? "Tested" : "Fresh",
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Scoring                                                          */
/* ------------------------------------------------------------------ */

const bias = (s: number) => (s >= 2 ? "Bullish" : s <= -2 ? "Bearish" : "Neutral");

function mkRow(
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
  const score = r1((rateScore + inflScore + gdpScore + cotScore) / 4);
  return {
    pair,
    category,
    score,
    bias: bias(score),
    rate,
    infl,
    gdp,
    rateScore: r1(rateScore),
    inflScore: r1(inflScore),
    gdpScore: r1(gdpScore),
    cotScore: r1(cotScore),
  };
}

/* ------------------------------------------------------------------ */
/* Main build (with in-memory cache)                                    */
/* ------------------------------------------------------------------ */

let cache: { at: number; data: MarketAnalysis } | null = null;
const TTL = 1000 * 60 * 60 * 6;

/** Never throws — on failure returns an empty analysis with a warning. */
export async function buildMarketAnalysisSafe(): Promise<MarketAnalysis> {
  try {
    return await buildMarketAnalysis();
  } catch (error) {
    console.error(error);
    return {
      updatedAt: new Date().toISOString(),
      cotReportDate: "—",
      fundament: [],
      details: {},
      cotSummary: [],
      seasonality: SK_MONTHS.map((month) => ({ month, value: 0 })),
      seasonalityNote: "Real data unavailable.",
      zones: [],
      sources: [],
      warnings: ["External data sources are currently unavailable — sample values are shown."],
    };
  }
}

export async function buildMarketAnalysis(): Promise<MarketAnalysis> {

  if (cache && Date.now() - cache.at < TTL) return cache.data;

  const codes = [
    ...Object.values(CCY).map((c) => c.cot),
    ...NON_FX.map((n) => n.cot),
  ].filter((v, i, a) => a.indexOf(v) === i);

  // Workerd allows only a limited number of concurrent subrequests —
  // we fetch data in smaller batches, not all at once.
  const [cot, rates, fredCpi] = await Promise.all([
    fetchCot(codes),
    fetchPolicyRates(),
    fetchFredCpi(),
  ]);
  const cpi = await fetchWorldBank("FP.CPI.TOTL.ZG");
  const gdpG = await fetchWorldBank("NY.GDP.MKTP.KD.ZG");
  const [goldMonthly, eurBars, jpyBars, gbpBars, goldBars] = await Promise.all([
    fetchBars("GC=F", "15y", "1mo"),
    fetchBars("EURUSD=X", "6mo", "1d"),
    fetchBars("USDJPY=X", "6mo", "1d"),
    fetchBars("GBPUSD=X", "6mo", "1d"),
    fetchBars("GC=F", "6mo", "1d"),
  ]);


  const warnings: string[] = [];
  if (cot.size === 0) warnings.push("Could not load CFTC COT data.");
  if (Object.keys(rates).length === 0) warnings.push("Could not load BIS rates.");
  if (Object.keys(cpi).length === 0) warnings.push("Could not load World Bank inflation.");
  if (!fredCpi && process.env["FRED_API_KEY"])
    warnings.push("FRED key is not working — using annual World Bank inflation.");

  const rateOf = (c: Ccy) => rates[CCY[c].bis];
  const inflOf = (c: Ccy) => {
    if (c === "USD" && fredCpi) return { v: fredCpi.v, year: fredCpi.date.slice(0, 7) };
    return cpi[CCY[c].wb];
  };
  const gdpOf = (c: Ccy) => gdpG[CCY[c].wb];
  const cotOf = (c: Ccy) => cotStats(cot.get(CCY[c].cot));

  const cotDate = (() => {
    for (const rows of cot.values()) if (rows[0]) return rows[0].date;
    return new Date().toISOString();
  })();

  const fundament: FundamentRow[] = [];
  const details: Record<string, InstrumentDetailReal> = {};

  const num = (v?: number) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const pct = (v: number | null, digits = 2) => (v == null ? "n/a" : `${v.toFixed(digits)} %`);

  // ---- Forex ----
  for (const [b, q] of FX_PAIRS) {
    const rb = num(rateOf(b));
    const rq = num(rateOf(q));
    const ib = num(inflOf(b)?.v);
    const iq = num(inflOf(q)?.v);
    const gb = num(gdpOf(b)?.v);
    const gq = num(gdpOf(q)?.v);
    const cb = cotOf(b);
    const cq = cotOf(q);

    const rateScore = rb != null && rq != null ? clamp((rb - rq) * 2) : 0;
    const inflScore = ib != null && iq != null ? clamp((ib - iq) * 1.5) : 0;
    const gdpScore = gb != null && gq != null ? clamp((gb - gq) * 2) : 0;
    // USD "net" is the dollar index - other currencies are computed inversely against it
    const netPct = (c: Ccy, s: ReturnType<typeof cotStats>) => (s ? s.pctOfOi * 20 : 0);
    const cotScore = clamp(netPct(b, cb) - netPct(q, cq));

    const pair = `${b}${q}`;
    fundament.push(
      mkRow(
        pair,
        "Forex",
        rb != null && rq != null ? `${rb.toFixed(2)} / ${rq.toFixed(2)} %` : "n/a",
        `${pct(ib, 1)} / ${pct(iq, 1)}`,
        `${pct(gb, 1)} / ${pct(gq, 1)}`,
        rateScore,
        inflScore,
        gdpScore,
        cotScore,
      ),
    );

    const rowsB = cot.get(CCY[b].cot);
    const rowsQ = cot.get(CCY[q].cot);
    const rows = rowsB ?? rowsQ ?? [];
    const cotCcy = rowsB ? b : q;

    details[pair] = {
      cotSource: `CFTC Legacy report — ${cotCcy} futures (CME/ICE)`,
      cot: {
        noncommercial: cotWeeks(rows, "noncommercial"),
        commercial: cotWeeks(rows, "commercial"),
        retail: cotWeeks(rows, "retail"),
      },
      macro: [
        {
          label: "Interest rate (differential)",
          value: rb != null && rq != null ? `${rb.toFixed(2)} % − ${rq.toFixed(2)} %` : "n/a",
          score: r1(rateScore),
          source: `BIS Policy Rates — ${CCY[b].bank} vs. ${CCY[q].bank}`,
          updated: "latest monthly BIS record",
          note: "A positive rate differential supports the base currency (carry).",
        },
        {
          label: "Inflation (y/y)",
          value: `${pct(ib, 1)} vs. ${pct(iq, 1)}`,
          score: r1(inflScore),
          source:
            b === "USD" && fredCpi
              ? "FRED CPIAUCSL + World Bank FP.CPI.TOTL.ZG"
              : "World Bank — FP.CPI.TOTL.ZG",
          updated: inflOf(b)?.year ?? "n/a",
          note: "Higher base currency inflation pushes toward tighter policy.",
        },
        {
          label: "Rast HDP (r/r)",
          value: `${pct(gb, 1)} vs. ${pct(gq, 1)}`,
          score: r1(gdpScore),
          source: "World Bank — NY.GDP.MKTP.KD.ZG",
          updated: gdpOf(b)?.year ?? "n/a",
          note: "Relatively stronger growth supports the currency.",
        },
        {
          label: "COT positioning",
          value: cb
            ? `${cotCcy} netto ${cb.net.toLocaleString("sk-SK")} (${cb.percentile}. percentil)`
            : "n/a",
          score: r1(cotScore),
          source: "CFTC — Commitments of Traders (Non-Commercial)",
          updated: fmtDate(cotDate),
          note: "Net position of large speculators as % of open interest.",
        },
      ],
    };
  }

  // ---- Commodities and indices ----
  const usRate = num(rateOf("USD")) ?? 0;
  const usInfl = num(inflOf("USD")?.v) ?? 0;
  const usGdp = num(gdpOf("USD")?.v) ?? 0;

  for (const item of NON_FX) {
    const rows = cot.get(item.cot) ?? [];
    const st = cotStats(rows);
    const cotScore = st ? clamp(st.pctOfOi * 25) : 0;
    const real = usRate - usInfl;
    const rateScore =
      item.kind === "commodity" ? clamp(-real * 2) : clamp((3 - usRate) * 1.5);
    const inflScore =
      item.kind === "commodity" ? clamp((usInfl - 2) * 1.5) : clamp(-(usInfl - 2) * 1.5);
    const gdpScore = clamp((usGdp - 1.5) * 2);

    fundament.push(
      mkRow(
        item.pair,
        item.category,
        `${usRate.toFixed(2)} % (Fed)`,
        pct(usInfl, 1),
        pct(usGdp, 1),
        rateScore,
        inflScore,
        gdpScore,
        cotScore,
      ),
    );

    details[item.pair] = {
      cotSource: `CFTC Legacy report — ${item.pair} futures`,
      cot: {
        noncommercial: cotWeeks(rows, "noncommercial"),
        commercial: cotWeeks(rows, "commercial"),
        retail: cotWeeks(rows, "retail"),
      },
      macro: [
        {
          label: "US real rate",
          value: `${real.toFixed(2)} % (${usRate.toFixed(2)} − ${usInfl.toFixed(1)})`,
          score: r1(rateScore),
          source: "BIS Policy Rates + inflation (World Bank/FRED)",
          updated: "latest available record",
          note:
            item.kind === "commodity"
              ? "Lower real rates support commodities (especially precious metals)."
              : "Lower rates lift equity index valuations.",
        },
        {
          label: "US inflation (y/y)",
          value: pct(usInfl, 1),
          score: r1(inflScore),
          source: fredCpi ? "FRED — CPIAUCSL (r/r)" : "World Bank — FP.CPI.TOTL.ZG",
          updated: fredCpi ? fredCpi.date : (inflOf("USD")?.year ?? "n/a"),
          note: "Inflation is positive for commodities, negative for indices.",
        },
        {
          label: "Rast HDP USA",
          value: pct(usGdp, 1),
          score: r1(gdpScore),
          source: "World Bank — NY.GDP.MKTP.KD.ZG",
          updated: gdpOf("USD")?.year ?? "n/a",
          note: "Stronger growth supports cyclical assets.",
        },
        {
          label: "COT positioning",
          value: st
            ? `netto ${st.net.toLocaleString("sk-SK")} (${st.percentile}. percentil)`
            : "n/a",
          score: r1(cotScore),
          source: "CFTC — Commitments of Traders (Non-Commercial)",
          updated: fmtDate(cotDate),
          note: "Net position of large speculators as % of open interest.",
        },
      ],
    };
  }

  // ---- COT overview ----
  const summaryList: { asset: string; code: string }[] = [
    { asset: "EUR", code: CCY.EUR.cot },
    { asset: "GBP", code: CCY.GBP.cot },
    { asset: "JPY", code: CCY.JPY.cot },
    { asset: "USD index", code: CCY.USD.cot },
    { asset: "GOLD", code: "088691" },
    { asset: "WTI", code: "067651" },
    { asset: "S&P 500", code: "13874A" },
  ];
  const cotSummary = summaryList
    .map((s) => {
      const st = cotStats(cot.get(s.code));
      return st ? { asset: s.asset, net: st.net, change: st.change, extreme: st.percentile } : null;
    })
    .filter(Boolean) as MarketAnalysis["cotSummary"];

  // ---- Seasonality and zones ----
  const seasonality =
    goldMonthly.length > 24
      ? seasonalityFrom(goldMonthly)
      : SK_MONTHS.map((month) => ({ month, value: 0 }));

  const zones = [
    ...zonesFrom(eurBars, "EURUSD", 5),
    ...zonesFrom(jpyBars, "USDJPY", 3),
    ...zonesFrom(gbpBars, "GBPUSD", 5),
    ...zonesFrom(goldBars, "XAUUSD", 2),
  ];

  const data: MarketAnalysis = {
    updatedAt: new Date().toISOString(),
    cotReportDate: fmtDate(cotDate),
    fundament,
    details,
    cotSummary,
    seasonality,
    seasonalityNote: `Average monthly change of XAUUSD (COMEX GC futures) over ${Math.round(goldMonthly.length / 12)} years — source Yahoo Finance.`,
    zones,
    sources: [
      "CFTC — Commitments of Traders (publicreporting.cftc.gov)",
      "BIS — Central bank policy rates (stats.bis.org)",
      "World Bank — inflation and GDP growth (api.worldbank.org)",
      fredCpi ? "FRED — CPIAUCSL" : null,
      "Yahoo Finance — prices for seasonality and S&D zones",
    ].filter(Boolean) as string[],
    warnings,
  };

  cache = { at: Date.now(), data };
  return data;
}

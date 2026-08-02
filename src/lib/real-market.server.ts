// Reálne trhové dáta: CFTC (COT), BIS (sadzby centrálnych bánk),
// World Bank (inflácia, HDP), Yahoo Finance (ceny → sezónnosť, S&D zóny).
// Voliteľne FRED (ak je nastavený platný FRED_API_KEY) pre mesačnú US infláciu.

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
  "Máj",
  "Jún",
  "Júl",
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
      signal: AbortSignal.timeout(20000),
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
  { pair: "XAUUSD", cot: "088691", category: "Komodity", kind: "commodity" },
  { pair: "XAGUSD", cot: "084691", category: "Komodity", kind: "commodity" },
  { pair: "XPTUSD", cot: "076651", category: "Komodity", kind: "commodity" },
  { pair: "COPPER", cot: "085692", category: "Komodity", kind: "commodity" },
  { pair: "WTI (US Oil)", cot: "067651", category: "Komodity", kind: "commodity" },
  { pair: "NATGAS", cot: "023651", category: "Komodity", kind: "commodity" },
  { pair: "WHEAT", cot: "001602", category: "Komodity", kind: "commodity" },
  { pair: "US500 (S&P 500)", cot: "13874A", category: "Indexy", kind: "index" },
  { pair: "US100 (Nasdaq)", cot: "209742", category: "Indexy", kind: "index" },
  { pair: "US30 (Dow)", cot: "124603", category: "Indexy", kind: "index" },
  { pair: "US2000 (Russell)", cot: "239742", category: "Indexy", kind: "index" },
  { pair: "BTCUSD", cot: "133741", category: "Komodity", kind: "commodity" },
  { pair: "US_DXY (Dolár index)", cot: "098662", category: "Indexy", kind: "index" },
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

/** Netto pozícia non-commercial ako % z open interestu + percentil za dostupnú históriu. */
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
/* BIS — sadzby centrálnych bánk                                       */
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
    /* prázdne = fallback */
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* World Bank — inflácia a rast HDP                                    */
/* ------------------------------------------------------------------ */

async function fetchWorldBank(indicator: string): Promise<Record<string, { v: number; year: string }>> {
  const countries = Object.values(CCY).map((c) => c.wb).join(";");
  const url = `https://api.worldbank.org/v2/country/${countries}/indicator/${indicator}?format=json&per_page=200&mrv=4`;
  let data = await getJson<any[]>(url);
  if (!Array.isArray(data) || !Array.isArray(data[1])) data = await getJson<any[]>(url);
  const out: Record<string, { v: number; year: string }> = {};


  if (!Array.isArray(data) || !Array.isArray(data[1])) return out;
  for (const row of data[1]) {
    const iso = row.countryiso3code as string;
    if (row.value == null) continue;
    const existing = out[iso];
    if (!existing || row.date > existing.year) out[iso] = { v: row.value as number, year: row.date };
  }
  return out;
}

/** Mesačná US inflácia z FRED, ak je k dispozícii platný kľúč. */
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
      status: tested ? "Testovaná" : "Fresh",
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Skórovanie                                                          */
/* ------------------------------------------------------------------ */

const bias = (s: number) => (s >= 2 ? "Bullish" : s <= -2 ? "Bearish" : "Neutrálny");

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
/* Hlavný build (s in-memory cache)                                    */
/* ------------------------------------------------------------------ */

let cache: { at: number; data: MarketAnalysis } | null = null;
const TTL = 1000 * 60 * 60 * 6;

export async function buildMarketAnalysis(): Promise<MarketAnalysis> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;

  const codes = [
    ...Object.values(CCY).map((c) => c.cot),
    ...NON_FX.map((n) => n.cot),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const [cot, rates, cpi, gdpG, fredCpi, goldMonthly, eurBars, jpyBars, gbpBars, goldBars] =
    await Promise.all([
      fetchCot(codes),
      fetchPolicyRates(),
      fetchWorldBank("FP.CPI.TOTL.ZG"),
      fetchWorldBank("NY.GDP.MKTP.KD.ZG"),
      fetchFredCpi(),
      fetchBars("GC=F", "15y", "1mo"),
      fetchBars("EURUSD=X", "6mo", "1d"),
      fetchBars("USDJPY=X", "6mo", "1d"),
      fetchBars("GBPUSD=X", "6mo", "1d"),
      fetchBars("GC=F", "6mo", "1d"),
    ]);

  const warnings: string[] = [];
  if (cot.size === 0) warnings.push("CFTC COT dáta sa nepodarilo načítať.");
  if (Object.keys(rates).length === 0) warnings.push("BIS sadzby sa nepodarilo načítať.");
  if (Object.keys(cpi).length === 0) warnings.push("World Bank inflácia sa nepodarila načítať.");
  if (!fredCpi && process.env["FRED_API_KEY"])
    warnings.push("FRED kľúč nefunguje — použitá ročná inflácia z World Bank.");

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
    // USD "netto" je index dolára – proti nemu sa ostatné meny počítajú inverzne
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
          label: "Úroková sadzba (rozdiel)",
          value: rb != null && rq != null ? `${rb.toFixed(2)} % − ${rq.toFixed(2)} %` : "n/a",
          score: r1(rateScore),
          source: `BIS Policy Rates — ${CCY[b].bank} vs. ${CCY[q].bank}`,
          updated: "posledný mesačný záznam BIS",
          note: "Kladný rozdiel sadzieb podporuje bázovú menu (carry).",
        },
        {
          label: "Inflácia (r/r)",
          value: `${pct(ib, 1)} vs. ${pct(iq, 1)}`,
          score: r1(inflScore),
          source:
            b === "USD" && fredCpi
              ? "FRED CPIAUCSL + World Bank FP.CPI.TOTL.ZG"
              : "World Bank — FP.CPI.TOTL.ZG",
          updated: inflOf(b)?.year ?? "n/a",
          note: "Vyššia inflácia bázovej meny tlačí na sprísnenie politiky.",
        },
        {
          label: "Rast HDP (r/r)",
          value: `${pct(gb, 1)} vs. ${pct(gq, 1)}`,
          score: r1(gdpScore),
          source: "World Bank — NY.GDP.MKTP.KD.ZG",
          updated: gdpOf(b)?.year ?? "n/a",
          note: "Relatívne silnejší rast podporuje menu.",
        },
        {
          label: "COT pozície",
          value: cb
            ? `${cotCcy} netto ${cb.net.toLocaleString("sk-SK")} (${cb.percentile}. percentil)`
            : "n/a",
          score: r1(cotScore),
          source: "CFTC — Commitments of Traders (Non-Commercial)",
          updated: fmtDate(cotDate),
          note: "Netto pozícia veľkých špekulantov ako % open interestu.",
        },
      ],
    };
  }

  // ---- Komodity a indexy ----
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
          label: "Reálna sadzba USA",
          value: `${real.toFixed(2)} % (${usRate.toFixed(2)} − ${usInfl.toFixed(1)})`,
          score: r1(rateScore),
          source: "BIS Policy Rates + inflácia (World Bank/FRED)",
          updated: "posledný dostupný záznam",
          note:
            item.kind === "commodity"
              ? "Nižšie reálne sadzby podporujú komodity (najmä drahé kovy)."
              : "Nižšie sadzby zvyšujú ocenenie akciových indexov.",
        },
        {
          label: "Inflácia USA (r/r)",
          value: pct(usInfl, 1),
          score: r1(inflScore),
          source: fredCpi ? "FRED — CPIAUCSL (r/r)" : "World Bank — FP.CPI.TOTL.ZG",
          updated: fredCpi ? fredCpi.date : (inflOf("USD")?.year ?? "n/a"),
          note: "Inflácia je pozitívna pre komodity, negatívna pre indexy.",
        },
        {
          label: "Rast HDP USA",
          value: pct(usGdp, 1),
          score: r1(gdpScore),
          source: "World Bank — NY.GDP.MKTP.KD.ZG",
          updated: gdpOf("USD")?.year ?? "n/a",
          note: "Silnejší rast podporuje cyklické aktíva.",
        },
        {
          label: "COT pozície",
          value: st
            ? `netto ${st.net.toLocaleString("sk-SK")} (${st.percentile}. percentil)`
            : "n/a",
          score: r1(cotScore),
          source: "CFTC — Commitments of Traders (Non-Commercial)",
          updated: fmtDate(cotDate),
          note: "Netto pozícia veľkých špekulantov ako % open interestu.",
        },
      ],
    };
  }

  // ---- COT prehľad ----
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

  // ---- Sezónnosť a zóny ----
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
    seasonalityNote: `Priemerná mesačná zmena XAUUSD (COMEX GC futures) za ${Math.round(goldMonthly.length / 12)} rokov — zdroj Yahoo Finance.`,
    zones,
    sources: [
      "CFTC — Commitments of Traders (publicreporting.cftc.gov)",
      "BIS — Central bank policy rates (stats.bis.org)",
      "World Bank — inflácia a rast HDP (api.worldbank.org)",
      fredCpi ? "FRED — CPIAUCSL" : null,
      "Yahoo Finance — ceny pre sezónnosť a S&D zóny",
    ].filter(Boolean) as string[],
    warnings,
  };

  cache = { at: Date.now(), data };
  return data;
}

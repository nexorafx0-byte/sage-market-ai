// Real seasonality from daily prices (Yahoo Finance) for 5 / 10 / 15 / 20-year windows.

import { SEASONALITY_SYMBOLS } from "./seasonality-types";
import type { SeasonalPoint, SeasonalityResult } from "./seasonality-types";

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

type Bar = { t: number; c: number };

const cache = new Map<string, { at: number; data: Bar[] }>();
const TTL = 1000 * 60 * 60 * 6;

async function fetchDaily(symbol: string): Promise<Bar[]> {
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?range=25y&interval=1d`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "TradingAnalyzerAI/1.0" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as any;
    const r = data?.chart?.result?.[0];
    if (!r) return [];
    const close = r.indicators?.quote?.[0]?.close ?? [];
    const out: Bar[] = [];
    (r.timestamp as number[]).forEach((t, i) => {
      if (close[i] == null) return;
      out.push({ t, c: close[i] });
    });
    cache.set(symbol, { at: Date.now(), data: out });
    return out;
  } catch {
    return [];
  }
}

function dayKey(d: Date) {
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function allKeys() {
  const keys: { key: string; label: string; dayIndex: number }[] = [];
  const base = Date.UTC(2001, 0, 1); // non-leap year -> 365 days
  for (let i = 0; i < 365; i++) {
    const d = new Date(base + i * 86400000);
    keys.push({
      key: dayKey(d),
      label: `${String(d.getUTCDate()).padStart(2, "0")} ${SK_MONTHS[d.getUTCMonth()]}`,
      dayIndex: i + 1,
    });
  }
  return keys;
}

export async function buildSeasonality(
  symbolId: string,
  years: number,
): Promise<SeasonalityResult | null> {
  const meta =
    SEASONALITY_SYMBOLS.find((s) => s.id === symbolId) ?? SEASONALITY_SYMBOLS[0];
  const bars = await fetchDaily(meta.yahoo);
  if (bars.length < 200) return null;

  const nowYear = new Date().getUTCFullYear();
  const startYear = nowYear - years;

  // zoskupenie po rokoch
  const byYear = new Map<number, Bar[]>();
  for (const b of bars) {
    const y = new Date(b.t * 1000).getUTCFullYear();
    if (y < startYear || y >= nowYear) continue; // completed years only
    const arr = byYear.get(y) ?? [];
    arr.push(b);
    byYear.set(y, arr);
  }

  const keys = allKeys();
  const acc = new Map<string, number[]>();
  keys.forEach((k) => acc.set(k.key, []));
  const monthly: number[][] = Array.from({ length: 12 }, () => []);

  const yearList = [...byYear.keys()].sort((a, b) => a - b);
  for (const y of yearList) {
    const arr = byYear.get(y)!.sort((a, b) => a.t - b.t);
    if (arr.length < 150) continue;
    const base = arr[0].c;
    // map day -> cumulative change
    const perDay = new Map<string, number>();
    for (const b of arr) {
      const d = new Date(b.t * 1000);
      perDay.set(dayKey(d), ((b.c - base) / base) * 100);
    }
    let last = 0;
    for (const k of keys) {
      const v = perDay.get(k.key);
      if (v != null) last = v;
      acc.get(k.key)!.push(last);
    }
    // monthly returns
    const monthFirst = new Map<number, number>();
    const monthLast = new Map<number, number>();
    for (const b of arr) {
      const m = new Date(b.t * 1000).getUTCMonth();
      if (!monthFirst.has(m)) monthFirst.set(m, b.c);
      monthLast.set(m, b.c);
    }
    for (let m = 0; m < 12; m++) {
      const f = monthFirst.get(m);
      const l = monthLast.get(m);
      if (f != null && l != null) monthly[m].push(((l - f) / f) * 100);
    }
  }

  const sampleYears = yearList.length;
  if (sampleYears === 0) return null;

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const rawPath = keys.map((k) => ({ ...k, value: avg(acc.get(k.key)!), years: acc.get(k.key)!.length }));
  const avgAnnual = rawPath[rawPath.length - 1]?.value ?? 0;

  const path: SeasonalPoint[] = rawPath.map((p, i) => ({
    key: p.key,
    label: p.label,
    dayIndex: p.dayIndex,
    value: Math.round(p.value * 100) / 100,
    detrended: Math.round((p.value - (avgAnnual * i) / (rawPath.length - 1)) * 100) / 100,
    years: p.years,
  }));

  const months = monthly.map((xs, i) => ({
    month: SK_MONTHS[i],
    value: Math.round(avg(xs) * 100) / 100,
    positive: xs.filter((x) => x > 0).length,
    total: xs.length,
  }));

  return {
    symbol: meta.id,
    label: meta.label,
    years,
    sampleYears,
    firstYear: yearList[0],
    lastYear: yearList[yearList.length - 1],
    path,
    months,
    avgAnnual: Math.round(avgAnnual * 100) / 100,
    source: `Yahoo Finance · ${meta.yahoo} · daily closing prices`,
    updatedAt: new Date().toISOString(),
  };
}

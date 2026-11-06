import {
  getSymbolMeta,
  getTimeframeMeta,
  type BacktestHistoryResult,
  type BacktestSymbolId,
  type BacktestTimeframe,
  type Candle,
} from "./backtest-types";

const DAY = 86400;
const MAX_CANDLES = 5000;

type HistoryInput = { symbol: BacktestSymbolId; timeframe: BacktestTimeframe; startDate: string; endDate: string };

function normalizeCandles(raw: unknown): Candle[] {
  const result = (raw as { chart?: { result?: unknown[] } })?.chart?.result?.[0] as {
    timestamp?: number[];
    indicators?: { quote?: { open?: number[]; high?: number[]; low?: number[]; close?: number[]; volume?: number[] }[] };
  } | undefined;
  if (!result?.timestamp) return [];
  const quote = result.indicators?.quote?.[0];
  if (!quote) return [];
  const candles: Candle[] = [];
  result.timestamp.forEach((time, index) => {
    const open = quote.open?.[index];
    const high = quote.high?.[index];
    const low = quote.low?.[index];
    const close = quote.close?.[index];
    if (![open, high, low, close].every((value) => typeof value === "number" && Number.isFinite(value) && value > 0)) return;
    candles.push({ time, open: open!, high: high!, low: low!, close: close!, volume: quote.volume?.[index] ?? 0 });
  });
  return candles.sort((a, b) => a.time - b.time).filter((candle, index, all) => index === 0 || candle.time !== all[index - 1].time).slice(-MAX_CANDLES);
}

function resampleFourHour(candles: Candle[]) {
  const buckets = new Map<number, Candle>();
  for (const candle of candles) {
    const time = Math.floor(candle.time / (4 * 3600)) * (4 * 3600);
    const previous = buckets.get(time);
    buckets.set(time, previous ? {
      ...previous,
      high: Math.max(previous.high, candle.high),
      low: Math.min(previous.low, candle.low),
      close: candle.close,
      volume: previous.volume + candle.volume,
    } : { ...candle, time });
  }
  return [...buckets.values()].sort((a, b) => a.time - b.time);
}

function generateDemoCandles(input: HistoryInput): Candle[] {
  const meta = getSymbolMeta(input.symbol);
  const timeframe = getTimeframeMeta(input.timeframe);
  let seed = 2166136261;
  for (const char of `${input.symbol}:${input.timeframe}:${input.startDate}`) {
    seed ^= char.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const end = Math.floor(Date.parse(`${input.endDate}T12:00:00Z`) / 1000 / timeframe.seconds) * timeframe.seconds;
  let price = meta.demoBase;
  let drift = 0;
  const candles: Candle[] = [];
  for (let index = 239; index >= 0; index -= 1) {
    if (random() < 0.08) drift = (random() - 0.5) * meta.demoVolatility * 0.25;
    const open = price;
    const move = drift + (random() - 0.5) * meta.demoVolatility * 2;
    const close = Math.max(meta.pipSize, open + move);
    const wick = meta.demoVolatility * (0.2 + random() * 0.7);
    candles.push({
      time: end - index * timeframe.seconds,
      open,
      high: Math.max(open, close) + wick * random(),
      low: Math.max(meta.pipSize, Math.min(open, close) - wick * random()),
      close,
      volume: Math.round(100 + random() * 1900),
    });
    price = close;
  }
  return candles;
}

export async function fetchBacktestHistory(input: HistoryInput): Promise<BacktestHistoryResult> {
  const meta = getSymbolMeta(input.symbol);
  const timeframe = getTimeframeMeta(input.timeframe);
  const startSeconds = Date.parse(`${input.startDate}T00:00:00Z`) / 1000;
  const endSeconds = Date.parse(`${input.endDate}T00:00:00Z`) / 1000 + DAY;
  const now = Math.floor(Date.now() / 1000);
  const rangeDays = (endSeconds - startSeconds) / DAY;
  let notice: string | null = null;

  if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds) || startSeconds >= endSeconds) {
    notice = "Choose a valid start and end date. Generated candles are shown in DEMO MODE.";
  } else if (rangeDays > timeframe.maxRangeDays) {
    notice = `${input.timeframe} supports a maximum ${timeframe.maxRangeDays}-day request. Shorten the range for real data; DEMO MODE is active.`;
  } else if (startSeconds < now - timeframe.maxPastDays * DAY) {
    notice = `${input.timeframe} history is available for approximately the last ${timeframe.maxPastDays} days. Choose a newer range for real data; DEMO MODE is active.`;
  }

  if (!notice) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(meta.yahoo)}?period1=${Math.floor(startSeconds)}&period2=${Math.min(Math.floor(endSeconds), now)}&interval=${timeframe.yahoo}&includePrePost=false&events=div%2Csplits`;
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 MARKETMIND-Backtesting/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`Provider returned ${response.status}`);
      let candles = normalizeCandles(await response.json());
      if (input.timeframe === "H4") candles = resampleFourHour(candles);
      if (candles.length >= 2) {
        return {
          symbol: input.symbol,
          timeframe: input.timeframe,
          candles,
          mode: "real",
          source: `Yahoo Finance · ${meta.yahoo}${input.timeframe === "H4" ? " · 1h aggregated to 4h" : ""}`,
          notice: input.timeframe === "H4" ? "H4 candles are aggregated from the provider's real H1 data." : null,
        };
      }
      notice = "The provider returned no usable candles for this range. Generated candles are shown in DEMO MODE.";
    } catch {
      notice = "Historical data API is unavailable. Generated candles are shown in DEMO MODE.";
    }
  }

  return {
    symbol: input.symbol,
    timeframe: input.timeframe,
    candles: generateDemoCandles(input),
    mode: "demo",
    source: "Deterministic generated candles · not historical market data",
    notice,
  };
}

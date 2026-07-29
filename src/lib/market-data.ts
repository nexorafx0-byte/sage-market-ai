// Deterministické ukážkové OHLC dáta + výpočty indikátorov pre graf.

export type Candle = {
  time: number; // unix seconds (UTC)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export const PAIRS = [
  { symbol: "EURUSD", base: 1.084, vol: 0.0035, digits: 5 },
  { symbol: "GBPUSD", base: 1.286, vol: 0.0042, digits: 5 },
  { symbol: "USDJPY", base: 157.4, vol: 0.55, digits: 3 },
  { symbol: "AUDUSD", base: 0.664, vol: 0.003, digits: 5 },
  { symbol: "XAUUSD", base: 2340, vol: 12, digits: 2 },
  { symbol: "BTCUSD", base: 64200, vol: 850, digits: 1 },
] as const;

export const TIMEFRAMES = [
  { key: "M15", label: "15m", seconds: 900 },
  { key: "H1", label: "1h", seconds: 3600 },
  { key: "H4", label: "4h", seconds: 14400 },
  { key: "D1", label: "1D", seconds: 86400 },
  { key: "W1", label: "1T", seconds: 604800 },
] as const;

export type TimeframeKey = (typeof TIMEFRAMES)[number]["key"];

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Vygeneruje realisticky vyzerajúce sviečky (náhodná prechádzka s trendom a šumom). */
export function generateCandles(symbol: string, tf: TimeframeKey, count = 260): Candle[] {
  const meta = PAIRS.find((p) => p.symbol === symbol) ?? PAIRS[0];
  const step = TIMEFRAMES.find((t) => t.key === tf)?.seconds ?? 3600;
  const rand = seeded(hash(symbol + tf));
  const scale = Math.sqrt(step / 3600);
  const vol = meta.vol * scale;

  // zarovnaný koniec, aby sa čas nemenil pri každom renderi
  const end = Math.floor(Date.UTC(2026, 6, 29, 12, 0, 0) / 1000 / step) * step;
  let price = meta.base * (0.97 + rand() * 0.06);
  let drift = (rand() - 0.5) * vol * 0.25;

  const out: Candle[] = [];
  for (let i = count - 1; i >= 0; i--) {
    if (rand() < 0.06) drift = (rand() - 0.5) * vol * 0.3;
    const open = price;
    const move = drift + (rand() - 0.5) * vol * 2;
    const close = open + move;
    const wick = Math.abs(move) * (0.4 + rand()) + vol * 0.2;
    const high = Math.max(open, close) + wick * rand();
    const low = Math.min(open, close) - wick * rand();
    price = close;
    out.push({
      time: end - i * step,
      open: round(open, meta.digits),
      high: round(high, meta.digits),
      low: round(low, meta.digits),
      close: round(close, meta.digits),
      volume: Math.round(500 + rand() * 2500 + Math.abs(move / vol) * 800),
    });
  }
  return out;
}

function round(v: number, digits: number) {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}

export function ema(values: number[], period: number) {
  const k = 2 / (period + 1);
  const out: (number | null)[] = [];
  let prev = 0;
  values.forEach((v, i) => {
    if (i < period - 1) {
      prev += v;
      out.push(null);
      return;
    }
    if (i === period - 1) {
      prev = (prev + v) / period;
      out.push(prev);
      return;
    }
    prev = v * k + prev * (1 - k);
    out.push(prev);
  });
  return out;
}

export function rsi(values: number[], period = 14) {
  const out: (number | null)[] = [null];
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const g = Math.max(diff, 0);
    const l = Math.max(-diff, 0);
    if (i <= period) {
      gain += g;
      loss += l;
      if (i === period) {
        gain /= period;
        loss /= period;
        out.push(100 - 100 / (1 + gain / (loss || 1e-9)));
      } else {
        out.push(null);
      }
      continue;
    }
    gain = (gain * (period - 1) + g) / period;
    loss = (loss * (period - 1) + l) / period;
    out.push(100 - 100 / (1 + gain / (loss || 1e-9)));
  }
  return out;
}

export function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const f = ema(values, fast);
  const s = ema(values, slow);
  const line = values.map((_, i) => (f[i] != null && s[i] != null ? f[i]! - s[i]! : null));
  const clean = line.map((v) => v ?? 0);
  const sig = ema(clean, signal);
  const hist = line.map((v, i) => (v != null && sig[i] != null ? v - sig[i]! : null));
  return { line, signal: sig, hist };
}

/** Jednoduchá detekcia supply/demand zón zo swing high/low. */
export function detectZones(candles: Candle[], lookback = 4) {
  const zones: { type: "supply" | "demand"; from: number; to: number; time: number }[] = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    const c = candles[i];
    const left = candles.slice(i - lookback, i);
    const right = candles.slice(i + 1, i + 1 + lookback);
    if (left.every((x) => x.high < c.high) && right.every((x) => x.high < c.high)) {
      zones.push({ type: "supply", from: Math.max(c.open, c.close), to: c.high, time: c.time });
    }
    if (left.every((x) => x.low > c.low) && right.every((x) => x.low > c.low)) {
      zones.push({ type: "demand", from: c.low, to: Math.min(c.open, c.close), time: c.time });
    }
  }
  return zones.slice(-6);
}

export function pctChange(candles: Candle[]) {
  if (candles.length < 2) return 0;
  const first = candles[0].close;
  const last = candles[candles.length - 1].close;
  return ((last - first) / first) * 100;
}

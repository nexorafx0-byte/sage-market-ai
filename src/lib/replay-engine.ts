import type { Candle } from "./backtest-types";

/** Replay owns only the cursor. Callers receive a copy with every future candle removed. */
export function clampReplayIndex(total: number, index: number) {
  if (total <= 0) return -1;
  return Math.max(0, Math.min(total - 1, Math.trunc(index)));
}

export function visibleCandles(candles: Candle[], replayIndex: number) {
  const index = clampReplayIndex(candles.length, replayIndex);
  return index < 0 ? [] : candles.slice(0, index + 1);
}

export function stepReplay(total: number, index: number, delta: number) {
  return clampReplayIndex(total, index + delta);
}

export function replayIndexForDate(candles: Candle[], date: string) {
  if (candles.length === 0) return -1;
  const start = Date.parse(`${date}T00:00:00Z`) / 1000;
  const index = candles.findIndex((candle) => candle.time >= start);
  return index < 0 ? candles.length - 1 : index;
}

export function replayDelayMs(speed: number) {
  const safeSpeed = Math.max(0.25, Math.min(10, speed));
  return Math.round(1000 / safeSpeed);
}

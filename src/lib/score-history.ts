// Deterministic 30-day history of the fundamental score for a pair.
// The last point always equals the current score; earlier points drift
// smoothly around it using a seeded pseudo-random walk, so the curve is
// stable between renders and unique per pair.

function seedFrom(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type ScorePoint = { day: number; score: number };

export function scoreHistory(pair: string, current: number, days = 30): ScorePoint[] {
  const rand = mulberry32(seedFrom(pair));
  const values: number[] = [];
  let v = current + (rand() - 0.5) * 4;
  for (let i = 0; i < days; i += 1) {
    v += (rand() - 0.5) * 1.6 + (current - v) * 0.08;
    values.push(Math.max(-10, Math.min(10, v)));
  }
  values[days - 1] = current;
  return values.map((score, i) => ({ day: i - (days - 1), score: Math.round(score * 100) / 100 }));
}

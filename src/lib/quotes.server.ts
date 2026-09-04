// Live prices from Yahoo Finance (server-only).

export type Quote = { symbol: string; price: number };

export async function fetchQuotes(symbols: string[]): Promise<Quote[]> {
  const out: Quote[] = [];
  for (const symbol of symbols.slice(0, 20)) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        symbol,
      )}?range=1d&interval=5m`;
      const res = await fetch(url, {
        headers: { "user-agent": "Mozilla/5.0", accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as any;
      const r = data?.chart?.result?.[0];
      const price =
        r?.meta?.regularMarketPrice ??
        (r?.indicators?.quote?.[0]?.close ?? []).filter((v: number | null) => v != null).pop();
      if (typeof price === "number") out.push({ symbol, price });
    } catch {
      // silently skip
    }
  }
  return out;
}

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getNewsFeed } from "@/lib/news.functions";
import type { FundamentRow } from "@/lib/mock-data";

const CCYS = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "NZD", "CAD", "CNY"];
const NON_FX: Record<string, string[]> = {
  XAU: ["USD"], XAG: ["USD"], WTI: ["USD"], OIL: ["USD"], US: ["USD"], SPX: ["USD"], NAS: ["USD"], DJ: ["USD"],
  GER: ["EUR"], DAX: ["EUR"], UK: ["GBP"], JP: ["JPY"], NIK: ["JPY"],
};

export function pairCurrencies(pair: string): string[] {
  const p = pair.toUpperCase();
  const fx = [p.slice(0, 3), p.slice(3, 6)].filter((c) => CCYS.includes(c));
  if (fx.length === 2) return fx;
  for (const [k, v] of Object.entries(NON_FX)) if (p.startsWith(k)) return v;
  return fx.length ? fx : ["USD"];
}

const BANKS: Record<string, string> = {
  USD: "Federal Reserve (Fed)", EUR: "European Central Bank (ECB)", GBP: "Bank of England (BoE)",
  JPY: "Bank of Japan (BoJ)", CHF: "Swiss National Bank (SNB)", AUD: "Reserve Bank of Australia (RBA)",
  NZD: "Reserve Bank of New Zealand (RBNZ)", CAD: "Bank of Canada (BoC)", CNY: "People's Bank of China (PBoC)",
};

function useFeed() {
  const fetchFeed = useServerFn(getNewsFeed);
  return useQuery({ queryKey: ["news-feed"], queryFn: () => fetchFeed(), staleTime: 5 * 60_000 });
}

export function InstrumentBankReports({ row }: { row: FundamentRow }) {
  const ccys = pairCurrencies(row.pair);
  const { data, isLoading } = useFeed();
  const events = (data?.calendar ?? []).filter(
    (e) => ccys.includes(e.country) && /rate|bank|fomc|ecb|boe|boj|rba|rbnz|boc|snb|monetary|minutes|press conference|governor|chair|powell|lagarde/i.test(e.title),
  );
  const rateFactors = (row.factors ?? []).filter((f) => /rate|yield/i.test(f.label));
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {ccys.map((c) => (
          <div key={c} className="rounded-lg border border-border p-4">
            <div className="text-xs text-muted-foreground">{c}</div>
            <div className="text-sm font-semibold">{BANKS[c] ?? c}</div>
          </div>
        ))}
      </div>
      {rateFactors.length > 0 && (
        <div className="rounded-lg border border-border p-4">
          <h4 className="mb-3 text-sm font-semibold">Rate factors</h4>
          {rateFactors.map((f) => (
            <div key={f.key} className="flex justify-between border-b border-border py-2 text-xs last:border-0">
              <span className="text-muted-foreground">{f.label}</span>
              <span className="font-mono">{f.value} <span className="text-muted-foreground">· {f.source}</span></span>
            </div>
          ))}
        </div>
      )}
      <div className="rounded-lg border border-border p-4">
        <h4 className="mb-3 text-sm font-semibold">Central bank events this week</h4>
        {isLoading ? <p className="text-xs text-muted-foreground">Loading…</p> : events.length ? <EventList events={events} /> : (
          <p className="text-xs text-muted-foreground">No central bank decisions, minutes or speeches for {ccys.join(" / ")} this week.</p>
        )}
      </div>
    </div>
  );
}

type Ev = { id: string; title: string; country: string; date: string; impact: string; forecast: string; previous: string; actual?: string };

function EventList({ events }: { events: Ev[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="text-left text-muted-foreground">
          <tr><th className="py-2">Time</th><th>Cur.</th><th>Impact</th><th>Event</th><th>Actual</th><th>Forecast</th><th>Previous</th></tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="border-t border-border">
              <td className="py-2 font-mono">{new Date(e.date).toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</td>
              <td className="font-mono">{e.country}</td>
              <td className={e.impact === "High" ? "text-destructive" : e.impact === "Medium" ? "text-primary" : "text-muted-foreground"}>{e.impact}</td>
              <td>{e.title}</td>
              <td className="font-mono">{e.actual || "—"}</td>
              <td className="font-mono">{e.forecast || "—"}</td>
              <td className="font-mono">{e.previous || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InstrumentCalendar({ row }: { row: FundamentRow }) {
  const ccys = pairCurrencies(row.pair);
  const { data, isLoading, isError } = useFeed();
  const events = (data?.calendar ?? []).filter((e) => ccys.includes(e.country));
  return (
    <div className="rounded-lg border border-border p-4">
      <h4 className="mb-3 text-sm font-semibold">Economic calendar · {ccys.join(" / ")}</h4>
      {isLoading ? <p className="text-xs text-muted-foreground">Loading…</p> : isError ? (
        <p className="text-xs text-destructive">Could not load the calendar.</p>
      ) : events.length ? <EventList events={events} /> : <p className="text-xs text-muted-foreground">No events this week.</p>}
      <p className="mt-3 text-[11px] text-muted-foreground">Source: Forex Factory weekly calendar.</p>
    </div>
  );
}

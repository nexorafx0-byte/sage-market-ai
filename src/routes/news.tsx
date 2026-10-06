import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { EventAi } from "@/components/event-ai";
import { PageHeader, Panel } from "@/components/page-shell";
import { Input } from "@/components/ui/input";
import { getNewsFeed } from "@/lib/news.functions";
import { cn } from "@/lib/utils";

const newsQueryOptions = queryOptions({
  queryKey: ["news-feed"],
  queryFn: () => getNewsFeed(),
  staleTime: 0,
  refetchInterval: 30 * 1000,
  refetchIntervalInBackground: true,
});

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "Forex news & economic calendar — MARKETMIND" },
      {
        name: "description",
        content:
          "Live Forex Factory economic calendar with impact filters plus real-time forex, commodity and economy headlines.",
      },
      { property: "og:title", content: "Forex news & economic calendar" },
      {
        property: "og:description",
        content: "Every high-impact release and market headline in one feed.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(newsQueryOptions),
  component: NewsPage,
  errorComponent: () => (
    <div className="p-6 text-sm text-muted-foreground">News feed is temporarily unavailable.</div>
  ),
  notFoundComponent: () => <div className="p-6 text-sm text-muted-foreground">Not found.</div>,
});

const IMPACTS = ["All", "High", "Medium", "Low"] as const;

function impactClass(impact: string) {
  const i = impact.toLowerCase();
  if (i === "high") return "bg-destructive/15 text-destructive border-destructive/30";
  if (i === "medium") return "bg-warning/15 text-warning border-warning/30";
  if (i === "holiday") return "bg-muted text-muted-foreground border-border";
  return "bg-primary/10 text-primary border-primary/25";
}

function dayKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unscheduled";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function NewsPage() {
  const { data } = useSuspenseQuery(newsQueryOptions);
  const [impact, setImpact] = useState<(typeof IMPACTS)[number]>("All");
  const [currency, setCurrency] = useState("All");
  const [search, setSearch] = useState("");

  const currencies = useMemo(() => {
    const set = new Set(data.calendar.map((e) => e.country).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [data.calendar]);

  const events = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.calendar.filter((e) => {
      if (impact !== "All" && e.impact.toLowerCase() !== impact.toLowerCase()) return false;
      if (currency !== "All" && e.country !== currency) return false;
      if (q && !e.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data.calendar, impact, currency, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const e of events) {
      const key = dayKey(e.date);
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [events]);

  const headlines = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.news;
    return data.news.filter((n) => n.title.toLowerCase().includes(q));
  }, [data.news, search]);

  return (
    <>
      <PageHeader
        title="News & economic calendar"
        subtitle="Forex Factory calendar for this week plus live market headlines"
      />
      <div className="grid gap-5 p-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Panel
            title="Economic calendar"
            hint={`${events.length} events · source: Forex Factory`}
            action={
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events & news"
                className="h-8 w-48"
              />
            }
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {IMPACTS.map((i) => (
                <button
                  key={i}
                  onClick={() => setImpact(i)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    impact === i
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {i} impact
                </button>
              ))}
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="ml-auto rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {grouped.length === 0 && (
              <p className="text-sm text-muted-foreground">No events match these filters.</p>
            )}

            <div className="space-y-6">
              {grouped.map(([day, list]) => (
                <div key={day} className="animate-rise">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                    {day}
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-left">Time</th>
                          <th className="px-3 py-2 text-left">Cur.</th>
                          <th className="px-3 py-2 text-left">Event</th>
                          <th className="px-3 py-2 text-left">Impact</th>
                          <th className="px-3 py-2 text-right">Forecast</th>
                          <th className="px-3 py-2 text-right">Previous</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((e) => (
                          <tr
                            key={e.id}
                            className="border-t border-border transition-colors hover:bg-secondary/30"
                          >
                            <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-muted-foreground">
                              {timeLabel(e.date)}
                            </td>
                            <td className="px-3 py-2 font-semibold">{e.country}</td>
                            <td className="px-3 py-2">{e.title}<EventAi event={e} /></td>
                            <td className="px-3 py-2">
                              <span
                                className={cn(
                                  "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                                  impactClass(e.impact),
                                )}
                              >
                                {e.impact}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-xs">
                              {e.forecast || "—"}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground">
                              {e.previous || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Market headlines" hint={`${headlines.length} stories · live feeds`}>
          <div className="max-h-[75vh] space-y-3 overflow-y-auto pr-1">
            {headlines.map((n) => (
              <a
                key={n.id}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="card-luxe block rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 font-medium text-primary">
                    {n.source}
                  </span>
                  <span>
                    {n.pubDate
                      ? new Date(n.pubDate).toLocaleString(undefined, {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-medium leading-snug text-foreground">{n.title}</p>
              </a>
            ))}
            {headlines.length === 0 && (
              <p className="text-sm text-muted-foreground">No headlines right now.</p>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CotOverview } from "@/components/cot-overview";
import { InstrumentDetailDialog } from "@/components/instrument-detail-dialog";
import { PageHeader, Panel, ScoreBar } from "@/components/page-shell";
import { SeasonalityPanel } from "@/components/seasonality-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMarketAnalysis } from "@/lib/market-analysis.functions";
import type { FundamentRow } from "@/lib/mock-data";
import { cotData, fundamentScore } from "@/lib/mock-data";
import { scoreHistory } from "@/lib/score-history";


export const Route = createFileRoute("/analyza")({
  head: () => ({
    meta: [
      { title: "AI market analysis — MARKETMIND" },
      {
        name: "description",
        content:
          "Fundamental score from real data (CFTC COT, BIS rates, World Bank) and seasonality.",
      },
      { property: "og:title", content: "AI market analysis — MARKETMIND" },
      {
        property: "og:description",
        content: "Real macro data, COT positioning and seasonality with AI commentary.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalysisPage,
});

const CATEGORIES = ["All", "Forex", "Commodities", "Indices"] as const;

function ScoreSpark({ pair, score }: { pair: string; score: number }) {
  const data = scoreHistory(pair, score).map((point) => ({ ...point, score: Math.round(Math.max(-10, Math.min(10, point.score))) }));
  const up = score >= 0;
  const stroke = up ? "hsl(var(--chart-2, 152 60% 45%))" : "hsl(var(--destructive))";
  const id = `spark-${pair}`;
  return (
    <div className="h-10 w-full opacity-75 transition-opacity duration-500 group-hover:opacity-100">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[-10, 10]} />
          <Area
            className="score-spark-path"
            type="monotone"
            dataKey="score"
            stroke={stroke}
            strokeWidth={1.6}
            fill={`url(#${id})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function FactorBars({ score }: { score: number | null }) {
  // 3 red bars (bearish) + 3 green bars (bullish); filled according to strength.
  const lvl = score == null ? 0 : Math.min(3, Math.ceil(Math.abs(score) / 3.34));
  const heights = [6, 9, 12];
  return (
    <span className="flex shrink-0 items-end gap-[2px]" aria-label={score == null ? "no data" : `score ${score}`}>
      {[2, 1, 0].map((i) => (
        <span
          key={`b${i}`}
          style={{ height: heights[2 - i], animationDelay: `${(2 - i) * 70}ms` }}
          className={`fx-bar w-[3px] rounded-sm ${score != null && score < 0 && i < lvl ? "bg-destructive" : "bg-destructive/20"}`}
        />
      ))}
      <span className="w-1" />
      {[0, 1, 2].map((i) => (
        <span
          key={`g${i}`}
          style={{ height: heights[i], animationDelay: `${(i + 3) * 70}ms` }}
          className={`fx-bar w-[3px] rounded-sm ${score != null && score > 0 && i < lvl ? "bg-success" : "bg-success/20"}`}
        />
      ))}
    </span>
  );
}

function RowCard({ r, onOpen }: { r: FundamentRow; onOpen: (r: FundamentRow) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(r)}
      className="card-luxe group w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-sm font-medium transition-colors duration-300 group-hover:text-primary">{r.pair}</span>
        <span className="text-xs text-muted-foreground">
          {r.bias} · {r.score > 0 ? "+" : ""}
           {r.score}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <ScoreBar value={r.score} max={10} />
        <span className="w-12 shrink-0 text-right font-mono text-xs">
          {r.score > 0 ? "+" : ""}
           {r.score}
        </span>
      </div>
      <div className="mt-2">
        <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          Last 30 days
        </div>
        <ScoreSpark pair={r.pair} score={r.score} />
      </div>

      {r.factors?.length ? (
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {r.factors.map((f) => {
            const score = f.value.startsWith("n/a") ? null : f.score;
            return (
              <div
                key={f.key}
                className="rounded-md border border-border/60 bg-background/40 px-2 py-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11px]">{f.label}</span>
                  <FactorBars score={score} />
                </div>
                <div className="mt-1 font-mono text-[11px] font-medium leading-tight">
                  <span className={score == null ? "text-muted-foreground" : score >= 0 ? "text-success" : "text-destructive"}>
                    {f.value}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-[9px] uppercase tracking-wide text-muted-foreground">
                  {f.source}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
          <span>Rate {r.rateScore}</span>
          <span>Inflation {r.inflScore}</span>
          <span>GDP {r.gdpScore}</span>
          <span>COT {r.cotScore}</span>
        </div>
      )}
    </button>
  );
}

function AnalysisPage() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<FundamentRow | null>(null);
  const [cotPair, setCotPair] = useState("EURUSD");


  const fetchAnalysis = useServerFn(getMarketAnalysis);
  const [cached, setCached] = useState<Awaited<ReturnType<typeof getMarketAnalysis>> | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mm-analysis");
      if (raw) setCached(JSON.parse(raw));
    } catch {}
  }, []);
  const { data, isLoading: qLoading, isError } = useQuery({
    queryKey: ["market-analysis"],
    queryFn: async () => {
      const d = await fetchAnalysis();
      try {
        if (d?.fundament?.length) localStorage.setItem("mm-analysis", JSON.stringify(d));
      } catch {}
      return d;
    },
    staleTime: 0,
    refetchInterval: 1000,
  });

  const live = data ?? cached ?? null;
  const isLoading = qLoading && !cached;
  const allRows = (live?.fundament?.length ? live.fundament : fundamentScore).map((row) => {
    const whole = (value: number) => Math.round(Math.max(-10, Math.min(10, value)));
    return {
      ...row,
      score: whole(row.score),
      rateScore: whole(row.rateScore),
      inflScore: whole(row.inflScore),
      gdpScore: whole(row.gdpScore),
      cotScore: whole(row.cotScore),
      factors: row.factors?.map((factor) => ({ ...factor, score: whole(factor.score) })),
    };
  });
  const cotRows = live?.cotSummary?.length ? live.cotSummary : cotData;
  const cotRow = allRows.find((r) => r.pair === cotPair) ?? allRows[0] ?? null;


  const rows = allRows.filter(
    (r) =>
      (cat === "All" || r.category === cat) &&
      r.pair.toLowerCase().includes(q.trim().toLowerCase()),
  );

  const sections: { title: string; items: FundamentRow[] }[] = [
    { title: "Forex pairs", items: rows.filter((r) => r.category === "Forex") },
    { title: "Commodities", items: rows.filter((r) => r.category === "Commodities") },
    { title: "Indices", items: rows.filter((r) => r.category === "Indices") },
  ];

  const statusLine = isLoading
    ? "Loading real data from CFTC, BIS and World Bank…"
    : isError || !live
      ? "Could not load real data — showing sample values."
      : `Real data · COT report ${live.cotReportDate} · updated ${new Date(live.updatedAt).toLocaleString("en-US")}`;

  return (
    <>
      <PageHeader title="AI market analysis" subtitle="Fundamentals · COT · Seasonality" />
      <div className="p-6">
        <div className="mb-4 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary animate-pulse" />
            {statusLine}
          </p>
          {live?.sources?.length ? (
            <p className="mt-1">Sources: {live.sources.join(" · ")}</p>
          ) : null}
          {live?.warnings?.length ? (
            <p className="mt-1 text-destructive">{live.warnings.join(" ")}</p>
          ) : null}
        </div>

        <Tabs defaultValue="fundament">
          <TabsList>
            <TabsTrigger value="fundament">Fundament</TabsTrigger>
            <TabsTrigger value="cot">COT</TabsTrigger>
            <TabsTrigger value="sezonnost">Seasonality</TabsTrigger>
          </TabsList>

          <TabsContent value="fundament" className="animate-rise mt-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                    className={
                      c === cat
                        ? "scale-[1.04] rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-[0_0_18px_-4px_oklch(0.74_0.16_162/70%)]"
                        : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary"
                    }
                >
                  {c}
                </button>
              ))}
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search instrument…"
                className="ml-auto w-44 rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-10">
              {sections.map(
                (s) =>
                  s.items.length > 0 && (
                    <section key={s.title}>
                      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        {s.title}
                      </h3>
                      <div className="stagger-children grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {s.items.map((r) => (
                          <RowCard key={r.pair} r={r} onOpen={setSelected} />
                        ))}
                      </div>
                    </section>
                  ),
              )}

              {rows.length === 0 && (
                <p className="text-sm text-muted-foreground">No instrument matches the filter.</p>
              )}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Click an instrument to open the full breakdown (rate, inflation, GDP, COT table and positioning donut chart).
            </p>

            <InstrumentDetailDialog
              row={selected}
              detail={selected ? (live?.details?.[selected.pair] ?? null) : null}
              onOpenChange={(o) => !o && setSelected(null)}
            />

            <p className="mt-4 text-xs text-muted-foreground">
              The score is the average of sub-ratings for interest rates, inflation, growth and COT positioning — each ranging from −10 (strongly bearish) to +10 (strongly bullish).
            </p>
          </TabsContent>

          <TabsContent value="cot" className="animate-rise mt-5">
            <div className="mb-5 rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">COT data by instrument</span>
                <select
                  value={cotPair}
                  onChange={(e) => setCotPair(e.target.value)}
                  className="ml-auto rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                >
                  {allRows.map((r) => (
                    <option key={r.pair} value={r.pair}>
                      {r.pair}
                    </option>
                  ))}
                </select>
              </div>
              {cotRow ? (
                <CotOverview
                  row={cotRow}
                  detail={live?.details?.[cotRow.pair] ?? null}
                  reportDate={live?.cotReportDate}
                />
              ) : null}
            </div>

            <Panel
              title="COT — large player positioning"
              hint={live ? `CFTC report ${live.cotReportDate}` : "Weekly change in net positions"}
            >
              <div className="space-y-4">

                {cotRows.map((c) => (
                  <div key={c.asset} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono font-semibold">{c.asset}</span>
                      <span className="font-mono text-sm">
                        Netto {c.net.toLocaleString("sk-SK")}
                      </span>
                      <span
                        className={
                          c.change >= 0
                            ? "font-mono text-sm text-success"
                            : "font-mono text-sm text-destructive"
                        }
                      >
                        {c.change >= 0 ? "+" : ""}
                        {c.change.toLocaleString("sk-SK")}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <ScoreBar value={c.extreme} />
                      <span className="w-28 shrink-0 text-right text-xs text-muted-foreground">
                        percentil {c.extreme}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </TabsContent>

          <TabsContent value="sezonnost" className="animate-rise mt-5">
            <SeasonalityPanel />
          </TabsContent>

        </Tabs>
      </div>
    </>
  );
}

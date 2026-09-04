import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import {
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

export const Route = createFileRoute("/analyza")({
  head: () => ({
    meta: [
      { title: "AI market analysis — Trading Analyzer AI" },
      {
        name: "description",
        content:
          "Fundamental score from real data (CFTC COT, BIS rates, World Bank) and seasonality.",
      },
      { property: "og:title", content: "AI market analysis — Trading Analyzer AI" },
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

function RowCard({ r, onOpen }: { r: FundamentRow; onOpen: (r: FundamentRow) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(r)}
      className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-sm font-medium">{r.pair}</span>
        <span className="text-xs text-muted-foreground">
          {r.bias} · {r.score > 0 ? "+" : ""}
          {r.score.toFixed(1)}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <ScoreBar value={r.score} max={10} />
        <span className="w-12 shrink-0 text-right font-mono text-xs">
          {r.score > 0 ? "+" : ""}
          {r.score.toFixed(1)}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
        <span>
          Sadzba {r.rate} ({r.rateScore > 0 ? "+" : ""}
          {r.rateScore})
        </span>
        <span>
          Inflation {r.infl} ({r.inflScore > 0 ? "+" : ""}
          {r.inflScore})
        </span>
        <span>
          HDP {r.gdp} ({r.gdpScore > 0 ? "+" : ""}
          {r.gdpScore})
        </span>
        <span>
          COT {r.cotScore > 0 ? "+" : ""}
          {r.cotScore}
        </span>
      </div>
    </button>
  );
}

function AnalysisPage() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<FundamentRow | null>(null);
  const [cotPair, setCotPair] = useState("EURUSD");


  const fetchAnalysis = useServerFn(getMarketAnalysis);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["market-analysis"],
    queryFn: () => fetchAnalysis(),
    staleTime: 1000 * 60 * 30,
  });

  const live = data ?? null;
  const allRows = live?.fundament?.length ? live.fundament : fundamentScore;
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
          <p>{statusLine}</p>
          {live?.sources?.length ? (
            <p className="mt-1">Zdroje: {live.sources.join(" · ")}</p>
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

          <TabsContent value="fundament" className="mt-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  className={
                    c === cat
                      ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
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
                      <div className="space-y-3">
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

          <TabsContent value="cot" className="mt-5">
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

          <TabsContent value="sezonnost" className="mt-5">
            <SeasonalityPanel />
          </TabsContent>

        </Tabs>
      </div>
    </>
  );
}

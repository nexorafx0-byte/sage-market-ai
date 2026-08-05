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

import { InstrumentDetailDialog } from "@/components/instrument-detail-dialog";
import { PageHeader, Panel, ScoreBar } from "@/components/page-shell";
import { SeasonalityPanel } from "@/components/seasonality-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMarketAnalysis } from "@/lib/market-analysis.functions";
import type { FundamentRow } from "@/lib/mock-data";
import { cotData, fundamentScore, supplyDemandZones } from "@/lib/mock-data";

export const Route = createFileRoute("/analyza")({
  head: () => ({
    meta: [
      { title: "AI analýza trhu — Trading Analyzer AI" },
      {
        name: "description",
        content:
          "Fundament score z reálnych dát (CFTC COT, BIS sadzby, World Bank), sezónnosť a supply & demand analýza.",
      },
      { property: "og:title", content: "AI analýza trhu — Trading Analyzer AI" },
      {
        property: "og:description",
        content: "Reálne makro dáta, COT pozície, sezónnosť a S&D zóny s AI komentárom.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalysisPage,
});

const CATEGORIES = ["Všetko", "Forex", "Komodity", "Indexy"] as const;

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
          Inflácia {r.infl} ({r.inflScore > 0 ? "+" : ""}
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
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Všetko");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<FundamentRow | null>(null);

  const fetchAnalysis = useServerFn(getMarketAnalysis);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["market-analysis"],
    queryFn: () => fetchAnalysis(),
    staleTime: 1000 * 60 * 30,
  });

  const live = data ?? null;
  const allRows = live?.fundament?.length ? live.fundament : fundamentScore;
  const cotRows = live?.cotSummary?.length ? live.cotSummary : cotData;
  const zoneRows = live?.zones?.length ? live.zones : supplyDemandZones;

  const rows = allRows.filter(
    (r) =>
      (cat === "Všetko" || r.category === cat) &&
      r.pair.toLowerCase().includes(q.trim().toLowerCase()),
  );

  const sections: { title: string; items: FundamentRow[] }[] = [
    { title: "Forex páry", items: rows.filter((r) => r.category === "Forex") },
    { title: "Komodity", items: rows.filter((r) => r.category === "Komodity") },
    { title: "Indexy", items: rows.filter((r) => r.category === "Indexy") },
  ];

  const statusLine = isLoading
    ? "Načítavam reálne dáta z CFTC, BIS a World Bank…"
    : isError || !live
      ? "Reálne dáta sa nepodarilo načítať — zobrazené sú ukážkové hodnoty."
      : `Reálne dáta · COT report ${live.cotReportDate} · aktualizované ${new Date(live.updatedAt).toLocaleString("sk-SK")}`;

  return (
    <>
      <PageHeader title="AI analýza trhu" subtitle="Fundament · COT · Sezónnosť · Supply & Demand" />
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
            <TabsTrigger value="sezonnost">Sezónnosť</TabsTrigger>
            <TabsTrigger value="sd">Supply & Demand</TabsTrigger>
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
                placeholder="Hľadať inštrument…"
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
                <p className="text-sm text-muted-foreground">Žiadny inštrument nezodpovedá filtru.</p>
              )}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Kliknutím na inštrument otvoríš detailný rozpis (sadzba, inflácia, HDP, COT tabuľka a
              kruhový graf pozícií).
            </p>

            <InstrumentDetailDialog
              row={selected}
              detail={selected ? (live?.details?.[selected.pair] ?? null) : null}
              onOpenChange={(o) => !o && setSelected(null)}
            />

            <p className="mt-4 text-xs text-muted-foreground">
              Skóre je priemer čiastkových hodnotení úrokových sadzieb, inflácie, rastu a COT
              pozícií — každé v rozsahu −10 (silne bearish) až +10 (silne bullish).
            </p>
          </TabsContent>

          <TabsContent value="cot" className="mt-5">
            <div className="mb-5 rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">COT dáta podľa inštrumentu</span>
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
              title="COT — pozície veľkých hráčov"
              hint={live ? `CFTC report ${live.cotReportDate}` : "Týždenná zmena netto pozícií"}
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


          <TabsContent value="sd" className="mt-5">
            <Panel
              title="Supply & Demand zóny"
              hint={live ? "Zo swingov reálnych denných sviečok" : "Detekcia podľa impulzu"}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {zoneRows.map((z) => (
                  <div key={`${z.pair}-${z.from}`} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold">
                        {z.pair} · {z.tf}
                      </span>
                      <span
                        className={
                          z.type === "Supply"
                            ? "rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
                            : "rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
                        }
                      >
                        {z.type}
                      </span>
                    </div>
                    <div className="mt-2 font-mono text-sm text-muted-foreground">
                      {z.from} – {z.to}
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <ScoreBar value={z.score} />
                      <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
                        {z.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

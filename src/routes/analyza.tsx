import { createFileRoute } from "@tanstack/react-router";
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

import { PageHeader, Panel, ScoreBar } from "@/components/page-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cotData, fundamentScore, seasonality, supplyDemandZones } from "@/lib/mock-data";

export const Route = createFileRoute("/analyza")({
  head: () => ({
    meta: [
      { title: "AI analýza trhu — Trading Analyzer AI" },
      {
        name: "description",
        content: "Fundament score, COT pozície, sezónnosť a supply & demand analýza na jednom mieste.",
      },
      { property: "og:title", content: "AI analýza trhu — Trading Analyzer AI" },
      {
        property: "og:description",
        content: "Fundament, COT, sezónnosť a S&D zóny s AI komentárom.",
      },
    ],
  }),
  component: AnalysisPage,
});

const CATEGORIES = ["Všetko", "Forex", "Komodity", "Indexy"] as const;

function AnalysisPage() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Všetko");
  const [q, setQ] = useState("");

  const rows = fundamentScore.filter(
    (r) =>
      (cat === "Všetko" || r.category === cat) &&
      r.pair.toLowerCase().includes(q.trim().toLowerCase()),
  );

  const CCY_ORDER = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD"];

  const groupName = (r: (typeof rows)[number]) => {
    if (r.category !== "Forex") return r.category;
    const base = r.pair.slice(0, 3);
    return CCY_ORDER.includes(base) ? `Forex — ${base}` : "Forex — exotické";
  };

  const order = [
    ...CCY_ORDER.map((c) => `Forex — ${c}`),
    "Forex — exotické",
    "Komodity",
    "Indexy",
  ];

  const groups = order
    .map((name) => ({ name, items: rows.filter((r) => groupName(r) === name) }))
    .filter((g) => g.items.length > 0);


  return (
    <>
      <PageHeader title="AI analýza trhu" subtitle="Fundament · COT · Sezónnosť · Supply & Demand" />
      <div className="p-6">
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

            <div className="grid gap-5 lg:grid-cols-2">
              {groups.map((g) => (
                <Panel
                  key={g.name}
                  title={g.name}
                  hint={`${g.items.length} inštrumentov · −10 až +10`}
                >
                  <div className="space-y-3">
                    {g.items.map((r) => (
                      <div key={r.pair} className="rounded-lg border border-border p-3">
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
                      </div>
                    ))}
                  </div>
                </Panel>
              ))}
              {groups.length === 0 && (
                <p className="text-sm text-muted-foreground">Žiadny inštrument nezodpovedá filtru.</p>
              )}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Skóre je priemer čiastkových hodnotení úrokových sadzieb, inflácie, rastu a COT
              pozícií — každé v rozsahu −10 (silne bearish) až +10 (silne bullish).
            </p>


          </TabsContent>

          <TabsContent value="cot" className="mt-5">
            <Panel title="COT — pozície veľkých hráčov" hint="Týždenná zmena netto pozícií">
              <div className="space-y-4">
                {cotData.map((c) => (
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
            <Panel title="Sezónnosť XAUUSD" hint="Priemerná mesačná zmena za 15 rokov (%)">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seasonality}>
                    <CartesianGrid vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} />
                    <Tooltip
                      cursor={{ fill: "var(--color-secondary)" }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--color-border)",
                        background: "var(--color-card)",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                      {seasonality.map((s) => (
                        <Cell
                          key={s.month}
                          fill={s.value >= 0 ? "var(--color-primary)" : "var(--color-destructive)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                AI: November a apríl sú historicky najsilnejšie mesiace (úspešnosť 73 %). September
                má negatívnu očakávanú hodnotu — vhodné znížiť expozíciu.
              </p>
            </Panel>
          </TabsContent>

          <TabsContent value="sd" className="mt-5">
            <Panel title="Supply & Demand zóny" hint="Detekcia podľa impulzu a nerovnováhy">
              <div className="grid gap-4 md:grid-cols-2">
                {supplyDemandZones.map((z) => (
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

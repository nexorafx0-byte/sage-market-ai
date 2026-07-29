import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Sparkles, AlertTriangle } from "lucide-react";

import { PageHeader, Panel, ScoreBar, Stat } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import {
  currencyStrength,
  equityCurve,
  newsFeed,
  supplyDemandZones,
  fundamentScore,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Trading Analyzer AI" },
      {
        name: "description",
        content:
          "Prehľad trhu: currency strength, fundament score, supply & demand zóny a AI upozornenia na správy.",
      },
      { property: "og:title", content: "Dashboard — Trading Analyzer AI" },
      {
        property: "og:description",
        content: "Jedna platforma pre makro analýzu, journal a risk manažment.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Streda, 29. júl · AI aktualizácia pred 4 minútami"
        actions={
          <Button className="gap-2">
            <Sparkles className="h-4 w-4" />
            Vygenerovať obchodný plán
          </Button>
        }
      />

      <div className="space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Equity" value="111 700 €" delta="+11.7 % tento mesiac" tone="positive" />
          <Stat label="Otvorené riziko" value="1.8 %" delta="Limit 3.0 %" />
          <Stat label="Winrate (30 d)" value="58 %" delta="+4 pb" tone="positive" />
          <Stat label="Profit factor" value="1.84" delta="-0.09" tone="negative" />
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Panel title="Equity krivka" hint="Posledných 30 dní · všetky účty" className="xl:col-span-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurve}>
                  <defs>
                    <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={60}
                    domain={["dataMin - 2000", "dataMax + 2000"]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#eq)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="AI makro analýza" hint="Zhrnutie relácie">
            <p className="text-sm leading-relaxed text-foreground">
              Dolár drží prevahu naprieč G8 — výnosy 2Y sa držia nad 4.1 % a trh preceňuje
              septembrové zníženie sadzieb na 38 %. Euro zostáva najslabšie po slabom nemeckom PMI.
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Preferovaný smer: <strong className="text-foreground">short EUR</strong> voči USD a
                CHF.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Zlato podporené sezónnosťou a rekordným COT netto longom — pozor na preplnenosť.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Riziková udalosť dňa: FOMC zápisnica o 20:00.
              </li>
            </ul>
            <div className="mt-5 flex items-start gap-2 rounded-lg bg-accent p-3 text-xs text-accent-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Znížená likvidita medzi 18:00 a 20:00 — AI odporúča polovičnú veľkosť pozície.
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Panel title="Currency Strength" hint="Vážený index za 24 h" className="xl:col-span-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currencyStrength}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="code" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} />
                  <Tooltip
                    cursor={{ fill: "var(--color-secondary)" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Fundament Score" hint="Kombinácia sadzieb, inflácie a rastu">
            <div className="space-y-4">
              {fundamentScore.map((row) => (
                <div key={row.pair}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono font-medium text-foreground">{row.pair}</span>
                    <span className="text-xs text-muted-foreground">
                      {row.bias} · {row.score > 0 ? "+" : ""}
                      {row.score}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <ScoreBar value={row.score} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Dôležité správy dnes" hint="AI komentár ku každej udalosti">
            <div className="space-y-4">
              {newsFeed.map((n) => (
                <article key={n.title} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-foreground">{n.time}</span>
                    <span
                      className={
                        n.impact === "high"
                          ? "rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive"
                          : "rounded-full bg-warning/15 px-2 py-0.5 font-medium text-warning-foreground"
                      }
                    >
                      {n.impact === "high" ? "Vysoký dopad" : "Stredný dopad"}
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-secondary-foreground">
                      {n.currency}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-foreground">{n.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{n.ai}</p>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Supply & Demand zóny" hint="Automatická detekcia AI">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">Pár</th>
                    <th className="pb-2 font-medium">TF</th>
                    <th className="pb-2 font-medium">Typ</th>
                    <th className="pb-2 font-medium">Zóna</th>
                    <th className="pb-2 text-right font-medium">Skóre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {supplyDemandZones.map((z) => (
                    <tr key={`${z.pair}-${z.tf}-${z.from}`}>
                      <td className="py-2.5 font-mono font-medium">{z.pair}</td>
                      <td className="py-2.5 text-muted-foreground">{z.tf}</td>
                      <td className="py-2.5">
                        <span
                          className={
                            z.type === "Supply"
                              ? "rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
                              : "rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
                          }
                        >
                          {z.type}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-xs text-muted-foreground">
                        {z.from} – {z.to}
                      </td>
                      <td className="py-2.5 text-right font-mono font-medium">{z.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

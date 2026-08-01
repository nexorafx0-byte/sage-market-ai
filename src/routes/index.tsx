import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Sparkles, AlertTriangle, Flame, Shield, Wallet, LineChart as LineIcon, BarChart3 } from "lucide-react";

import { PageHeader, Panel, ScoreBar } from "@/components/page-shell";
import { PnlCalendar } from "@/components/pnl-calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  accountSummary,
  balanceSeries,
  capitalFlows,
  riskStats,
  statisticsRows,
  tradeCountSeries,
  tradeStats,
} from "@/lib/account-stats";
import {
  currencyStrength,
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
          "Prehľad účtu: gain, net P&L, drawdown, štatistiky, obchodný kalendár a AI makro analýza.",
      },
      { property: "og:title", content: "Dashboard — Trading Analyzer AI" },
      {
        property: "og:description",
        content: "Jedna platforma pre makro analýzu, journal a risk manažment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

type StatRow = { label: string; value: string; tone?: "negative" | "accent" };

function StatList({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: React.ReactNode;
  rows: StatRow[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </div>
      <div className="divide-y divide-border rounded-lg border border-border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span
              className={cn(
                "font-mono text-xs font-medium text-foreground",
                r.tone === "negative" && "text-destructive",
                r.tone === "accent" && "text-primary",
              )}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
        <div className="grid gap-5 xl:grid-cols-3">
          {/* Ľavý stĺpec — súhrn účtu */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between border-l-2 border-primary pl-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Gain %
                </div>
                <div className="mt-1 font-mono text-lg font-semibold text-success">
                  +{accountSummary.gainPct.toFixed(2)} %
                </div>
                <div className="font-mono text-xs text-success">
                  +{accountSummary.gainAbsPct.toFixed(2)} % Abs
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Net P&amp;L
                </div>
                <div className="mt-1 font-mono text-lg font-semibold text-success">
                  +{accountSummary.netPnl.toFixed(2)} €
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <StatList title="Risk" icon={<Shield className="h-3.5 w-3.5" />} rows={riskStats} />
              <StatList
                title="Kapitálové toky"
                icon={<Wallet className="h-3.5 w-3.5" />}
                rows={capitalFlows}
              />
              <StatList
                title="Štatistiky"
                icon={<LineIcon className="h-3.5 w-3.5" />}
                rows={statisticsRows}
              />
              <StatList
                title="Trade Stats"
                icon={<BarChart3 className="h-3.5 w-3.5" />}
                rows={tradeStats}
              />
            </div>
          </section>

          {/* Pravý blok — trade count, winstreak, balance */}
          <div className="space-y-5 xl:col-span-2">
            <div className="grid gap-5 md:grid-cols-2">
              <Panel title="Trade Count" hint="Posledných 14 dní">
                <div className="font-mono text-2xl font-semibold text-foreground">
                  {accountSummary.tradeCount}
                </div>
                <div className="mt-2 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tradeCountSeries}>
                      <Line
                        type="monotone"
                        dataKey="v"
                        stroke="var(--color-primary)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Winstreak" hint="Aktuálna séria">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      v: accountSummary.winstreakDays,
                      label: "Dni",
                      best: accountSummary.winstreakDaysBest,
                      worst: accountSummary.winstreakDaysWorst,
                    },
                    {
                      v: accountSummary.winstreakTrades,
                      label: "Obchody",
                      best: accountSummary.winstreakTradesBest,
                      worst: accountSummary.winstreakTradesWorst,
                    },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-2xl font-semibold text-destructive">
                          {s.v}
                        </span>
                        <Flame className="h-4 w-4 text-warning" />
                        <span className="text-sm text-muted-foreground">{s.label}</span>
                      </div>
                      <div className="mt-2 flex gap-1.5 text-[11px]">
                        <span className="rounded bg-success/15 px-1.5 py-0.5 font-medium text-success">
                          BEST {s.best}
                        </span>
                        <span className="rounded bg-destructive/10 px-1.5 py-0.5 font-medium text-destructive">
                          WORST {s.worst}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <Panel
              title="Balance"
              hint={`+${accountSummary.balanceChangePct.toFixed(2)} % tento mesiac`}
            >
              <div className="font-mono text-3xl font-semibold text-foreground">
                {accountSummary.balance.toLocaleString("sk-SK", {
                  minimumFractionDigits: 2,
                })}{" "}
                €
              </div>
              <div className="mt-3 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceSeries}>
                    <defs>
                      <linearGradient id="bal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      width={64}
                      domain={["dataMin - 100", "dataMax + 100"]}
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
                      fill="url(#bal)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        </div>

        <Panel title="Obchodný kalendár" hint="P&L po dňoch a týždňoch">
          <PnlCalendar />
        </Panel>


        <div className="grid gap-5 xl:grid-cols-3">


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

          <Panel title="Fundament Score" hint="Top 8 podľa sily · škála −10 až +10">
            <div className="space-y-4">
              {[...fundamentScore]
                .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
                .slice(0, 8)
                .map((row) => (
                <div key={row.pair}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono font-medium text-foreground">{row.pair}</span>
                    <span className="text-xs text-muted-foreground">
                      {row.bias} · {row.score > 0 ? "+" : ""}
                      {row.score.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <ScoreBar value={row.score} max={10} />
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

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader, Panel, Stat } from "@/components/page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Risk manager — Trading Analyzer AI" },
      {
        name: "description",
        content: "Kalkulačka veľkosti pozície, denné limity a kontrola drawdownu pre funded účty.",
      },
      { property: "og:title", content: "Risk manager — Trading Analyzer AI" },
      { property: "og:description", content: "Veľkosť pozície a limity rizika pod kontrolou." },
    ],
  }),
  component: RiskPage,
});

function RiskPage() {
  const [balance, setBalance] = useState(100000);
  const [riskPct, setRiskPct] = useState(1);
  const [slPips, setSlPips] = useState(25);

  const riskAmount = (balance * riskPct) / 100;
  const lots = slPips > 0 ? riskAmount / (slPips * 10) : 0;

  return (
    <>
      <PageHeader title="Risk manager" subtitle="Veľkosť pozície, denné limity a drawdown" />
      <div className="space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Denné riziko" value="1.8 % / 3.0 %" delta="ostáva 1.2 %" />
          <Stat label="Aktuálny drawdown" value="3.2 %" delta="limit 10 %" tone="positive" />
          <Stat label="Otvorené pozície" value="2" delta="EURUSD, XAUUSD" />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Kalkulačka veľkosti pozície">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="balance">Kapitál (€)</Label>
                <Input
                  id="balance"
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="risk">Riziko (%)</Label>
                <Input
                  id="risk"
                  type="number"
                  step="0.1"
                  value={riskPct}
                  onChange={(e) => setRiskPct(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sl">Stop loss (pipy)</Label>
                <Input
                  id="sl"
                  type="number"
                  value={slPips}
                  onChange={(e) => setSlPips(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-secondary p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Riziko na obchod
                </div>
                <div className="mt-1 font-mono text-2xl font-semibold">
                  {riskAmount.toLocaleString("sk-SK", { maximumFractionDigits: 0 })} €
                </div>
              </div>
              <div className="rounded-lg bg-accent p-4">
                <div className="text-xs uppercase tracking-wide text-accent-foreground/80">
                  Veľkosť pozície
                </div>
                <div className="mt-1 font-mono text-2xl font-semibold text-accent-foreground">
                  {lots.toFixed(2)} lot
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Limity a pravidlá" hint="AI blokuje obchody nad limit">
            <div className="space-y-5">
              {[
                { label: "Denná strata", value: 60, text: "1.8 % z 3.0 %" },
                { label: "Celkový drawdown", value: 32, text: "3.2 % z 10 %" },
                { label: "Počet obchodov / deň", value: 40, text: "2 z 5" },
                { label: "Korelovaná expozícia", value: 75, text: "USD 75 %" },
              ].map((l) => (
                <div key={l.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{l.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">{l.text}</span>
                  </div>
                  <Progress value={l.value} className="mt-2" />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

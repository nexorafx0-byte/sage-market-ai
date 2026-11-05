import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader, Panel, Stat } from "@/components/page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Risk manager — MARKETMIND" },
      {
        name: "description",
        content: "Position size calculator, daily limits and drawdown control.",
      },
      { property: "og:title", content: "Risk manager — MARKETMIND" },
      { property: "og:description", content: "Position size and risk limits under control." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
      <PageHeader title="Risk manager" subtitle="Position size, daily limits and drawdown" />
      <div className="space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Daily risk" value="1.8 % / 3.0 %" delta="1.2 % remaining" />
          <Stat label="Current drawdown" value="3.2 %" delta="limit 10 %" tone="positive" />
          <Stat label="Open positions" value="2" delta="EURUSD, XAUUSD" />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Position size calculator">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="balance">Capital (€)</Label>
                <Input
                  id="balance"
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="risk">Risk (%)</Label>
                <Input
                  id="risk"
                  type="number"
                  step="0.1"
                  value={riskPct}
                  onChange={(e) => setRiskPct(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sl">Stop loss (pips)</Label>
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
                  Risk per trade
                </div>
                <div className="mt-1 font-mono text-2xl font-semibold">
                  {riskAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })} €
                </div>
              </div>
              <div className="rounded-lg bg-accent p-4">
                <div className="text-xs uppercase tracking-wide text-accent-foreground/80">
                  Position size
                </div>
                <div className="mt-1 font-mono text-2xl font-semibold text-accent-foreground">
                  {lots.toFixed(2)} lot
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Limits and rules" hint="AI blocks trades above the limit">
            <div className="space-y-5">
              {[
                { label: "Daily loss", value: 60, text: "1.8 % of 3.0 %" },
                { label: "Total drawdown", value: 32, text: "3.2 % of 10 %" },
                { label: "Trades per day", value: 40, text: "2 of 5" },
                { label: "Correlated exposure", value: 75, text: "USD 75 %" },
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

import { createFileRoute } from "@tanstack/react-router";
import { Play } from "lucide-react";

import { PageHeader, Panel } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { backtests } from "@/lib/mock-data";

export const Route = createFileRoute("/backtesting")({
  head: () => ({
    meta: [
      { title: "Backtesting — Trading Analyzer AI" },
      {
        name: "description",
        content: "Historické testovanie stratégií s metrikami winrate, profit factor a expectancy.",
      },
      { property: "og:title", content: "Backtesting — Trading Analyzer AI" },
      { property: "og:description", content: "Otestuj stratégiu na historických dátach." },
    ],
  }),
  component: BacktestingPage,
});

function BacktestingPage() {
  return (
    <>
      <PageHeader
        title="Backtesting"
        subtitle="Výsledky uložených stratégií"
        actions={
          <Button className="gap-2">
            <Play className="h-4 w-4" />
            Spustiť nový test
          </Button>
        }
      />
      <div className="p-6">
        <Panel title="Stratégie" hint="Dáta od januára 2021">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">Stratégia</th>
                  <th className="pb-2 text-right font-medium">Obchody</th>
                  <th className="pb-2 text-right font-medium">Winrate</th>
                  <th className="pb-2 text-right font-medium">Profit factor</th>
                  <th className="pb-2 text-right font-medium">Max DD</th>
                  <th className="pb-2 text-right font-medium">Expectancy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {backtests.map((b) => (
                  <tr key={b.name}>
                    <td className="py-3 font-medium">{b.name}</td>
                    <td className="py-3 text-right font-mono">{b.trades}</td>
                    <td className="py-3 text-right font-mono">{b.winrate} %</td>
                    <td className="py-3 text-right font-mono text-success">{b.pf}</td>
                    <td className="py-3 text-right font-mono text-destructive">{b.dd} %</td>
                    <td className="py-3 text-right font-mono">{b.expectancy}R</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}

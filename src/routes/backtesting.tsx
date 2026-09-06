import { createFileRoute } from "@tanstack/react-router";
import { Play } from "lucide-react";

import { PageHeader, Panel } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { backtests } from "@/lib/mock-data";

export const Route = createFileRoute("/backtesting")({
  head: () => ({
    meta: [
      { title: "Backtesting — MARKETMIND" },
      {
        name: "description",
        content: "Historical strategy testing with winrate, profit factor and expectancy metrics.",
      },
      { property: "og:title", content: "Backtesting — MARKETMIND" },
      { property: "og:description", content: "Test your strategy on historical data." },
    ],
  }),
  component: BacktestingPage,
});

function BacktestingPage() {
  return (
    <>
      <PageHeader
        title="Backtesting"
        subtitle="Results of saved strategies"
        actions={
          <Button className="gap-2">
            <Play className="h-4 w-4" />
            Run new test
          </Button>
        }
      />
      <div className="p-6">
        <Panel title="Strategies" hint="Data since January 2021">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">Strategy</th>
                  <th className="pb-2 text-right font-medium">Trades</th>
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

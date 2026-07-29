import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, Panel } from "@/components/page-shell";
import { Progress } from "@/components/ui/progress";
import { fundedAccounts } from "@/lib/mock-data";

export const Route = createFileRoute("/ucty")({
  head: () => ({
    meta: [
      { title: "Funded účty — Trading Analyzer AI" },
      {
        name: "description",
        content: "Dashboard pre prop firm účty: fázy, ciele, drawdown a payout prehľad.",
      },
      { property: "og:title", content: "Funded účty — Trading Analyzer AI" },
      { property: "og:description", content: "Všetky prop firm účty na jednej obrazovke." },
    ],
  }),
  component: AccountsPage,
});

function AccountsPage() {
  return (
    <>
      <PageHeader title="Funded účty" subtitle="Prehľad prop firm výziev a financovaných účtov" />
      <div className="grid gap-5 p-6 lg:grid-cols-3">
        {fundedAccounts.map((a) => (
          <Panel key={a.name} title={a.name} hint={a.phase}>
            <div className="font-mono text-3xl font-semibold">
              {a.balance.toLocaleString("sk-SK")} €
            </div>
            <div className="mt-1 font-mono text-sm text-success">
              +{a.profit.toLocaleString("sk-SK")} €
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Postup k cieľu</span>
                  <span className="font-mono">{a.target} %</span>
                </div>
                <Progress value={a.target} className="mt-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Drawdown</span>
                  <span className="font-mono">
                    {a.dd} % / {a.ddMax} %
                  </span>
                </div>
                <Progress value={(a.dd / a.ddMax) * 100} className="mt-1.5" />
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ScoreBar } from "@/components/page-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cotHistory, macroSources } from "@/lib/instrument-detail";
import type { FundamentRow } from "@/lib/mock-data";

const nf = (n: number) => n.toLocaleString("sk-SK");

export function InstrumentDetailDialog({
  row,
  onOpenChange,
}: {
  row: FundamentRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  if (!row) return null;
  const sources = macroSources(row);
  const weeks = cotHistory(row);
  const latest = weeks[0];
  const pie = [
    { name: "Long", value: latest.longOi },
    { name: "Short", value: latest.shortOi },
  ];

  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">
            {row.pair} · {row.bias} ({row.score > 0 ? "+" : ""}
            {row.score.toFixed(1)})
          </DialogTitle>
          <DialogDescription>
            Rozpis makroekonomických dát a COT pozícií vrátane zdrojov.
          </DialogDescription>
        </DialogHeader>

        {/* Makro rozpis */}
        <div className="space-y-3">
          {sources.map((s) => (
            <div key={s.label} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">{s.label}</span>
                <span className="font-mono text-sm">{s.value}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <ScoreBar value={s.score} max={10} />
                <span className="w-12 shrink-0 text-right font-mono text-xs">
                  {s.score > 0 ? "+" : ""}
                  {s.score}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{s.note}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Zdroj: {s.source} · aktualizované {s.updated}
              </p>
            </div>
          ))}
        </div>

        {/* COT tabuľka */}
        <div className="mt-2">
          <h3 className="mb-2 text-sm font-semibold">
            Commitments of Traders (Noncommercial positions)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-right font-mono text-xs">
              <thead>
                <tr className="bg-secondary text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Dátum</th>
                  <th className="px-3 py-2 font-medium">Long zmena</th>
                  <th className="px-3 py-2 font-medium">% Long</th>
                  <th className="px-3 py-2 font-medium">Long OI</th>
                  <th className="px-3 py-2 font-medium">Open Interest</th>
                  <th className="px-3 py-2 font-medium">Short OI</th>
                  <th className="px-3 py-2 font-medium">% Short</th>
                  <th className="px-3 py-2 font-medium">Short zmena</th>
                  <th className="px-3 py-2 font-medium">Netto</th>
                </tr>
              </thead>
              <tbody>
                {weeks.map((w) => (
                  <tr key={w.date} className="border-t border-border">
                    <td className="px-3 py-2 text-left">{w.date}</td>
                    <td
                      className={`px-3 py-2 ${w.longChange >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
                    >
                      {w.longChange >= 0 ? "+" : ""}
                      {nf(w.longChange)}
                    </td>
                    <td className="bg-success/5 px-3 py-2">{w.longPct.toFixed(2)} %</td>
                    <td className="bg-success/5 px-3 py-2">{nf(w.longOi)}</td>
                    <td className="px-3 py-2">{nf(w.openInterest)}</td>
                    <td className="bg-destructive/5 px-3 py-2">{nf(w.shortOi)}</td>
                    <td className="bg-destructive/5 px-3 py-2">{w.shortPct.toFixed(2)} %</td>
                    <td
                      className={`px-3 py-2 ${w.shortChange >= 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}
                    >
                      {w.shortChange >= 0 ? "+" : ""}
                      {nf(w.shortChange)}
                    </td>
                    <td
                      className={`px-3 py-2 ${w.net >= 0 ? "text-success" : "text-destructive"}`}
                    >
                      {nf(w.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Zdroj: CFTC — Commitments of Traders, týždenné dáta (utorkové uzávierky).
          </p>
        </div>

        {/* Kruhový graf */}
        <div className="mt-2 rounded-lg border border-border p-4">
          <h3 className="mb-2 text-sm font-semibold">
            Rozdelenie pozícií — {latest.date}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(1)} %`
                  }
                >
                  <Cell fill="var(--color-success)" />
                  <Cell fill="var(--color-destructive)" />
                </Pie>
                <Tooltip
                  formatter={(v: number) => nf(v)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

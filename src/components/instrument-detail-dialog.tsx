import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CotOverview } from "@/components/cot-overview";
import { ScoreBar } from "@/components/page-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COT_GROUPS, cotHistory, macroSources } from "@/lib/instrument-detail";
import type { CotGroup } from "@/lib/instrument-detail";
import type { InstrumentDetailReal } from "@/lib/market-types";
import type { FundamentRow } from "@/lib/mock-data";
import { scoreHistory } from "@/lib/score-history";

function ScoreHistoryChart({ pair, score }: { pair: string; score: number }) {
  const points = scoreHistory(pair, score).map((p) => {
    const d = new Date();
    d.setDate(d.getDate() + p.day);
    return {
      ...p,
      label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    };
  });
  const up = score >= 0;
  const stroke = up ? "var(--color-success)" : "var(--color-destructive)";

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Score history — last 30 days</h3>
        <span className="font-mono text-xs text-muted-foreground">
          now {score > 0 ? "+" : ""}
          {score.toFixed(1)}
        </span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="score-hist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.4} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              interval={4}
              tickLine={false}
              axisLine={false}
            />
            <YAxis domain={[-10, 10]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <ReferenceLine y={0} stroke="var(--color-border)" />
            <Tooltip
              formatter={(v: number) => [`${v > 0 ? "+" : ""}${v.toFixed(2)}`, "Score"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke={stroke}
              strokeWidth={2}
              fill="url(#score-hist)"
              dot={{ r: 1.6, fill: stroke }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


const nf = (n: number) => n.toLocaleString("sk-SK");

function CotSection({
  row,
  group,
  label,
  desc,
  source,
  real,
}: {
  row: FundamentRow;
  group: CotGroup;
  label: string;
  desc: string;
  source: string;
  real?: InstrumentDetailReal | null;
}) {
  const realWeeks = real?.cot?.[group];
  const weeks = realWeeks && realWeeks.length > 0 ? realWeeks : cotHistory(row, group);
  const latest = weeks[0];
  const longEntry = Math.max(0, latest.longChange);
  const longExit = Math.abs(Math.min(0, latest.longChange));
  const shortEntry = Math.max(0, latest.shortChange);
  const shortExit = Math.abs(Math.min(0, latest.shortChange));


  const pie = [
    { name: "Long vstup", value: longEntry, color: "var(--color-success)" },
    { name: "Short vstup", value: shortEntry, color: "var(--color-success)" },
    { name: "Long exit", value: longExit, color: "var(--color-destructive)" },
    { name: "Short exit", value: shortExit, color: "var(--color-destructive)" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{desc}</p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-right font-mono text-xs">
          <thead>
            <tr className="bg-secondary text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">Date</th>
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
                <td className={`px-3 py-2 ${w.net >= 0 ? "text-success" : "text-destructive"}`}>
                  {nf(w.net)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground">Source: {source} · weekly data.</p>

      <div className="rounded-lg border border-border p-4">
        <h4 className="mb-2 text-sm font-semibold">
          {label} — weekly position changes ({latest.date})
        </h4>
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
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)} %`}
              >
                {pie.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
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
    </div>
  );
}

export function InstrumentDetailDialog({
  row,
  detail,
  onOpenChange,
}: {
  row: FundamentRow | null;
  detail?: InstrumentDetailReal | null;
  onOpenChange: (open: boolean) => void;
}) {
  if (!row) return null;
  const sources = detail?.macro?.length ? detail.macro : macroSources(row);
  const isReal = !!detail?.macro?.length;

  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">
            {row.pair} · {row.bias} ({row.score > 0 ? "+" : ""}
            {row.score.toFixed(1)})
          </DialogTitle>
          <DialogDescription>
            {isReal
              ? "Real data: BIS (rates), World Bank (inflation, GDP) and CFTC COT (Non-Commercial, Commercial, Retail)."
              : "Breakdown of macroeconomic data and COT positioning (Non-Commercial, Commercial, Retail)."}
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
                Source: {s.source} · updated {s.updated}
              </p>
            </div>
          ))}
        </div>

        {/* COT overview - donuts + group table */}
        <div className="mt-2">
          <CotOverview row={row} detail={detail} />
        </div>

        {/* COT by group */}
        <div className="mt-2">
          <h3 className="mb-3 text-sm font-semibold">COT history — by group</h3>
          <Tabs defaultValue="noncommercial">
            <TabsList>
              {COT_GROUPS.map((g) => (
                <TabsTrigger key={g.key} value={g.key}>
                  {g.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {COT_GROUPS.map((g) => (
              <TabsContent key={g.key} value={g.key} className="mt-4">
                <CotSection
                  row={row}
                  group={g.key}
                  label={g.label}
                  desc={g.desc}
                  source={detail?.cotSource ?? g.source}
                  real={detail}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

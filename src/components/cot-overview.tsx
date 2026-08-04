import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { COT_GROUPS, cotHistory } from "@/lib/instrument-detail";
import type { CotGroup } from "@/lib/instrument-detail";
import type { CotWeekReal, InstrumentDetailReal } from "@/lib/market-types";
import type { FundamentRow } from "@/lib/mock-data";

const nf = (n: number) => Math.round(n).toLocaleString("sk-SK");

const DONUT_LABEL: Record<CotGroup, string> = {
  commercial: "Commercials",
  noncommercial: "Large Speculators",
  retail: "Small Traders",
};

const ORDER: CotGroup[] = ["commercial", "noncommercial", "retail"];

function latestFor(
  row: FundamentRow,
  group: CotGroup,
  real?: InstrumentDetailReal | null,
): CotWeekReal {
  const realWeeks = real?.cot?.[group];
  const weeks = realWeeks && realWeeks.length > 0 ? realWeeks : cotHistory(row, group);
  return weeks[0];
}

function Donut({ title, long, short }: { title: string; long: number; short: number }) {
  const total = long + short || 1;
  const data = [
    { name: "Long", value: long, color: "var(--color-success)" },
    { name: "Short", value: short, color: "var(--color-destructive)" },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={42}
              outerRadius={70}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, n: string) =>
                [`${nf(v)} (${((v / total) * 100).toFixed(1)} %)`, n] as [string, string]
              }
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="font-mono text-[11px] text-muted-foreground">
        <span className="text-success">{((long / total) * 100).toFixed(1)} % L</span>
        {" · "}
        <span className="text-destructive">{((short / total) * 100).toFixed(1)} % S</span>
      </p>
    </div>
  );
}

export function CotOverview({
  row,
  detail,
  reportDate,
}: {
  row: FundamentRow;
  detail?: InstrumentDetailReal | null;
  reportDate?: string;
}) {
  const rows = ORDER.map((g) => ({ group: g, week: latestFor(row, g, detail) }));

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">
          COT <span className="font-mono text-muted-foreground">{row.pair}</span>
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success" /> Long
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-destructive" /> Short
          </span>
          <span>{reportDate ?? rows[0].week.date}</span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {rows.map(({ group, week }) => (
          <Donut
            key={group}
            title={DONUT_LABEL[group]}
            long={week.longOi}
            short={week.shortOi}
          />
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-right font-mono text-xs">
          <thead>
            <tr className="bg-secondary text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">Skupina</th>
              <th className="px-3 py-2 font-medium">Long</th>
              <th className="px-3 py-2 font-medium">% Long</th>
              <th className="px-3 py-2 font-medium">Short</th>
              <th className="px-3 py-2 font-medium">% Short</th>
              <th className="px-3 py-2 font-medium">Netto</th>
              <th className="px-3 py-2 font-medium">Δ Long</th>
              <th className="px-3 py-2 font-medium">Δ Short</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ group, week }) => (
              <tr key={group} className="border-t border-border">
                <td className="px-3 py-2 text-left font-sans">
                  {DONUT_LABEL[group]}
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    {COT_GROUPS.find((g) => g.key === group)?.label}
                  </span>
                </td>
                <td className="bg-success/5 px-3 py-2">{nf(week.longOi)}</td>
                <td className="bg-success/5 px-3 py-2">{week.longPct.toFixed(2)} %</td>
                <td className="bg-destructive/5 px-3 py-2">{nf(week.shortOi)}</td>
                <td className="bg-destructive/5 px-3 py-2">{week.shortPct.toFixed(2)} %</td>
                <td className={`px-3 py-2 ${week.net >= 0 ? "text-success" : "text-destructive"}`}>
                  {week.net >= 0 ? "+" : ""}
                  {nf(week.net)}
                </td>
                <td
                  className={`px-3 py-2 ${week.longChange >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {week.longChange >= 0 ? "+" : ""}
                  {nf(week.longChange)}
                </td>
                <td
                  className={`px-3 py-2 ${week.shortChange >= 0 ? "text-destructive" : "text-success"}`}
                >
                  {week.shortChange >= 0 ? "+" : ""}
                  {nf(week.shortChange)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Zdroj: {detail?.cotSource ?? "CFTC Commitments of Traders (Legacy report)"} · Commercials =
        hedgeri, Large Speculators = non-commercial, Small Traders = non-reportable (retail).
      </p>
    </div>
  );
}

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

function weeksFor(
  row: FundamentRow,
  group: CotGroup,
  real?: InstrumentDetailReal | null,
): CotWeekReal[] {
  const realWeeks = real?.cot?.[group];
  return realWeeks && realWeeks.length > 0 ? realWeeks : cotHistory(row, group);
}

const shortDate = (d: string) => {
  const parts = d.split("-");
  return parts.length === 3 ? `${parts[2]}.${parts[1]}.` : d;
};

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  fontSize: 12,
} as const;

function CotHistoryCharts({
  row,
  detail,
}: {
  row: FundamentRow;
  detail?: InstrumentDetailReal | null;
}) {
  const series = ORDER.map((g) => ({ group: g, weeks: weeksFor(row, g, detail) }));
  const base = series[0].weeks;
  // data comes newest-first — reverse to chronological order
  const netData = [...base]
    .map((_, i) => {
      const idx = base.length - 1 - i;
      const rec: Record<string, string | number> = { date: shortDate(base[idx].date) };
      for (const s of series) {
        const w = s.weeks[idx];
        if (w) rec[s.group] = w.net;
      }
      return rec;
    })
    .filter((r) => Object.keys(r).length > 1);

  const flowData = [...base].map((_, i) => {
    const idx = base.length - 1 - i;
    const w = series[1].weeks[idx] ?? base[idx];
    return {
      date: shortDate(w.date),
      long: w.longOi,
      short: -w.shortOi,
    };
  });

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-border p-3">
        <p className="mb-2 text-xs font-semibold">Net position trend (recent weeks)</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={netData} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
              <YAxis
                tick={{ fontSize: 10 }}
                stroke="var(--color-muted-foreground)"
                width={58}
                tickFormatter={(v: number) => nf(v)}
              />
              <ReferenceLine y={0} stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, n: string) =>
                  [nf(v), DONUT_LABEL[n as CotGroup] ?? n] as [string, string]
                }
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(n: string) => DONUT_LABEL[n as CotGroup] ?? n}
              />
              <Line
                type="monotone"
                dataKey="commercial"
                stroke="var(--color-chart-3)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="noncommercial"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="retail"
                stroke="var(--color-warning)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-border p-3">
        <p className="mb-2 text-xs font-semibold">
          Long vs Short — Large Speculators (open contracts)
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={flowData} stackOffset="sign" margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
              <YAxis
                tick={{ fontSize: 10 }}
                stroke="var(--color-muted-foreground)"
                width={58}
                tickFormatter={(v: number) => nf(Math.abs(v))}
              />
              <ReferenceLine y={0} stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, n: string) =>
                  [nf(Math.abs(v)), n === "long" ? "Long" : "Short"] as [string, string]
                }
              />
              <Bar dataKey="long" stackId="oi" fill="var(--color-success)" radius={[3, 3, 0, 0]} />
              <Bar
                dataKey="short"
                stackId="oi"
                fill="var(--color-destructive)"
                radius={[0, 0, 3, 3]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
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
  const rows = ORDER.map((g) => ({ group: g, week: weeksFor(row, g, detail)[0] }));

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

      <CotHistoryCharts row={row} detail={detail} />

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

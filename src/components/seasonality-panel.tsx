import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Cell,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Panel } from "@/components/page-shell";
import { getSeasonality } from "@/lib/seasonality.functions";
import { SEASONALITY_SYMBOLS, SEASONALITY_WINDOWS } from "@/lib/seasonality-types";

const pct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)} %`;

// Sezónny rok = nepriestupný rok (365 dní), index 0 = 1. januára.
const BASE_YEAR = 2001;
const idxToIso = (i: number) => {
  const d = new Date(Date.UTC(BASE_YEAR, 0, 1 + Math.max(0, Math.min(364, i))));
  return d.toISOString().slice(0, 10);
};
const isoToIdx = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  if (!m || !d) return null;
  const t = Date.UTC(BASE_YEAR, m - 1, d);
  const i = Math.round((t - Date.UTC(BASE_YEAR, 0, 1)) / 86400000);
  return Math.max(0, Math.min(364, i));
};

export function SeasonalityPanel() {
  const [symbol, setSymbol] = useState<string>("XAUUSD");
  const [years, setYears] = useState<number>(10);
  const [detrend, setDetrend] = useState(true);
  const [range, setRange] = useState<{ start: number; end: number } | null>(null);
  const [drag, setDrag] = useState<{ start: number; end: number } | null>(null);


  const fetchSeasonality = useServerFn(getSeasonality);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["seasonality", symbol, years],
    queryFn: () => fetchSeasonality({ data: { symbol, years } }),
    staleTime: 1000 * 60 * 60,
  });

  const chartData = useMemo(
    () =>
      (data?.path ?? []).map((p) => ({
        label: p.label,
        value: detrend ? p.detrended : p.value,
      })),
    [data, detrend],
  );

  const todayIdx = useMemo(() => {
    const now = new Date();
    const start = Date.UTC(now.getUTCFullYear(), 0, 1);
    return Math.min(
      364,
      Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - start) / 86400000),
    );
  }, []);

  const labelToIdx = useMemo(() => {
    const m = new Map<string, number>();
    chartData.forEach((d, i) => m.set(d.label, i));
    return m;
  }, [chartData]);

  const norm = (r: { start: number; end: number } | null) =>
    r ? { start: Math.min(r.start, r.end), end: Math.max(r.start, r.end) } : null;

  const active = norm(drag) ?? range;

  const sel = useMemo(() => {
    if (!active || chartData.length === 0) return null;
    const a = chartData[Math.max(0, active.start)];
    const b = chartData[Math.min(chartData.length - 1, active.end)];
    if (!a || !b) return null;
    const slice = chartData.slice(active.start, active.end + 1);
    const lows = slice.map((s) => s.value);
    return {
      from: a.label,
      to: b.label,
      fromIdx: active.start,
      toIdx: active.end,
      change: b.value - a.value,
      days: active.end - active.start + 1,
      min: Math.min(...lows) - a.value,
      max: Math.max(...lows) - a.value,
    };
  }, [active, chartData]);

  const monthRows = data?.months ?? [];


  return (
    <div className="space-y-6">
      <Panel
        title={`Sezónnosť ${data?.label ?? symbol}`}
        hint={
          data
            ? `${data.sampleYears} rokov (${data.firstYear}–${data.lastYear}) · ${data.source}`
            : isLoading
              ? "Načítavam reálne dáta…"
              : "Dáta sa nepodarilo načítať"
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select
            value={symbol}
            onChange={(e) => {
              setSymbol(e.target.value);
              setRange(null);
            }}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
          >
            {SEASONALITY_SYMBOLS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            {SEASONALITY_WINDOWS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  setYears(w);
                  setRange(null);
                }}
                className={
                  w === years
                    ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary"
                }
              >
                {w} rokov
              </button>
            ))}
          </div>

          <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={detrend}
              onChange={(e) => setDetrend(e.target.checked)}
              className="accent-[var(--color-primary)]"
            />
            Detrending
          </label>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-secondary/40 p-3">
          <div>
            <label className="mb-1 block text-[11px] text-muted-foreground">Od (deň/mesiac)</label>
            <input
              type="date"
              value={idxToIso(range?.start ?? 0)}
              min={idxToIso(0)}
              max={idxToIso(364)}
              onChange={(e) => {
                const i = isoToIdx(e.target.value);
                if (i == null) return;
                setRange((r) => ({ start: i, end: Math.max(i, r?.end ?? i) }));
              }}
              className="rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-muted-foreground">Do (deň/mesiac)</label>
            <input
              type="date"
              value={idxToIso(range?.end ?? 364)}
              min={idxToIso(0)}
              max={idxToIso(364)}
              onChange={(e) => {
                const i = isoToIdx(e.target.value);
                if (i == null) return;
                setRange((r) => ({ start: Math.min(i, r?.start ?? i), end: i }));
              }}
              className="rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <span className="text-[11px] text-muted-foreground">
            Rok je iba pomocný — počíta sa deň a mesiac.
          </span>
          <button
            type="button"
            onClick={() => setRange(null)}
            className="ml-auto rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
          >
            Zrušiť výber
          </button>
        </div>

        <div className="h-80 select-none">
          {isError || (!isLoading && !data) ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Sezónne dáta pre {symbol} sa nepodarilo načítať.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                onMouseDown={(e: { activeLabel?: string }) => {
                  const i = e?.activeLabel != null ? labelToIdx.get(e.activeLabel) : undefined;
                  if (i != null) setDrag({ start: i, end: i });
                }}
                onMouseMove={(e: { activeLabel?: string }) => {
                  if (!drag) return;
                  const i = e?.activeLabel != null ? labelToIdx.get(e.activeLabel) : undefined;
                  if (i != null) setDrag((d) => (d ? { start: d.start, end: i } : d));
                }}
                onMouseUp={() => {
                  const n = norm(drag);
                  if (n && n.end > n.start) setRange(n);
                  setDrag(null);
                }}
                onMouseLeave={() => setDrag(null)}
              >

                <defs>
                  <linearGradient id="seasonFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  minTickGap={40}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={48}
                  tickFormatter={(v: number) => `${v.toFixed(1)}%`}
                />
                <Tooltip
                  formatter={(v: number) => [pct(v), "Priemer"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                />
                <ReferenceLine y={0} stroke="var(--color-border)" />
                {chartData[todayIdx] && (
                  <ReferenceLine
                    x={chartData[todayIdx].label}
                    stroke="var(--color-destructive)"
                    strokeDasharray="4 3"
                    label={{ value: "DNES", position: "top", fontSize: 10, fill: "var(--color-destructive)" }}
                  />
                )}
                {sel && (
                  <ReferenceArea
                    x1={sel.from}
                    x2={sel.to}
                    fill="var(--color-primary)"
                    fillOpacity={0.08}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#seasonFill)"
                  isAnimationActive={false}
                />
                <Brush
                  dataKey="label"
                  height={24}
                  travellerWidth={8}
                  stroke="var(--color-primary)"
                  fill="var(--color-secondary)"
                  onChange={(r: { startIndex?: number; endIndex?: number }) =>
                    setRange(
                      r.startIndex != null && r.endIndex != null
                        ? { start: r.startIndex, end: r.endIndex }
                        : null,
                    )
                  }
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-4 rounded-lg border border-border p-4">
          <h4 className="text-sm font-semibold">Analýza vybraného obdobia</h4>
          {sel ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Obdobie</p>
                <p className="font-mono text-sm">
                  {sel.from} – {sel.to}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Priemerný výnos</p>
                <p
                  className={`font-mono text-sm ${sel.change >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {pct(sel.change)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Max / min v období</p>
                <p className="font-mono text-sm">
                  {pct(sel.max)} / {pct(sel.min)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dĺžka</p>
                <p className="font-mono text-sm">{sel.days} dní</p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Potiahnutím lišty pod grafom zakresli obdobie — vypočítam priemerný sezónny výnos za
              posledných {data?.sampleYears ?? years} rokov.
            </p>
          )}
        </div>
      </Panel>

      <Panel title="Priemerný výnos podľa mesiaca" hint={`${years} rokov · reálne dáta`}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthRows}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={48}
                tickFormatter={(v: number) => `${v.toFixed(1)}%`}
              />
              <Tooltip
                cursor={{ fill: "var(--color-secondary)" }}
                formatter={(v: number) => [pct(v), "Priemer"]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                {monthRows.map((m) => (
                  <Cell
                    key={m.month}
                    fill={m.value >= 0 ? "var(--color-success)" : "var(--color-destructive)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {monthRows.map((m) => (
            <div
              key={m.month}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-xs"
            >
              <span className="font-medium">{m.month}</span>
              <span className={m.value >= 0 ? "font-mono text-success" : "font-mono text-destructive"}>
                {pct(m.value)}
              </span>
              <span className="text-muted-foreground">
                {m.total ? Math.round((m.positive / m.total) * 100) : 0} % rokov rast
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

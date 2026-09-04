import { useMemo } from "react";
import {
  Bar,
  Brush,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { detectZones, ema, macd, rsi, type Candle } from "@/lib/market-data";

export type ChartType = "candles" | "bars" | "area";

export type ChartSettings = {
  type: ChartType;
  ema20: boolean;
  ema50: boolean;
  ema200: boolean;
  volume: boolean;
  rsi: boolean;
  macd: boolean;
  zones: boolean;
};

type Row = {
  label: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  range: [number, number];
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  rsi: number | null;
  macd: number | null;
  signal: number | null;
  hist: number | null;
};

const UP = "var(--color-success)";
const DOWN = "var(--color-destructive)";
const GRID = "var(--color-border)";

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  fontSize: 12,
};

function formatTime(t: number, tf: string) {
  const d = new Date(t * 1000);
  if (tf === "D1" || tf === "W1")
    return d.toLocaleDateString("sk-SK", { day: "2-digit", month: "2-digit" });
  return d.toLocaleString("sk-SK", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Custom candle shape: wick + body. */
function CandleShape(props: any) {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload as Row;
  const span = high - low || 1e-9;
  const ratio = height / span;
  const bullish = close >= open;
  const color = bullish ? "var(--color-success)" : "var(--color-destructive)";
  const bodyTop = y + (high - Math.max(open, close)) * ratio;
  const bodyH = Math.max(Math.abs(close - open) * ratio, 1);
  const w = Math.max(width * 0.7, 1);
  const cx = x + width / 2;
  return (
    <g>
      <line x1={cx} x2={cx} y1={y} y2={y + height} stroke={color} strokeWidth={1} />
      <rect x={cx - w / 2} y={bodyTop} width={w} height={bodyH} fill={color} rx={1} />
    </g>
  );
}

/** OHLC bar: left tick = open, right = close. */
function BarShape(props: any) {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload as Row;
  const span = high - low || 1e-9;
  const ratio = height / span;
  const color = close >= open ? "var(--color-success)" : "var(--color-destructive)";
  const cx = x + width / 2;
  const yo = y + (high - open) * ratio;
  const yc = y + (high - close) * ratio;
  const tick = Math.max(width * 0.35, 2);
  return (
    <g stroke={color} strokeWidth={1.4} fill="none">
      <line x1={cx} x2={cx} y1={y} y2={y + height} />
      <line x1={cx - tick} x2={cx} y1={yo} y2={yo} />
      <line x1={cx} x2={cx + tick} y1={yc} y2={yc} />
    </g>
  );
}

export default function TradingChart({
  candles,
  settings,
  timeframe = "H1",
  digits = 5,
  height = 460,
}: {
  candles: Candle[];
  settings: ChartSettings;
  timeframe?: string;
  digits?: number;
  height?: number;
}) {
  const rows = useMemo<Row[]>(() => {
    const closes = candles.map((c) => c.close);
    const e20 = ema(closes, 20);
    const e50 = ema(closes, 50);
    const e200 = ema(closes, 200);
    const r = rsi(closes);
    const m = macd(closes);
    return candles.map((c, i) => ({
      label: formatTime(c.time, timeframe),
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
      range: [c.low, c.high],
      ema20: e20[i],
      ema50: e50[i],
      ema200: e200[i],
      rsi: r[i],
      macd: m.line[i],
      signal: m.signal[i],
      hist: m.hist[i],
    }));
  }, [candles, timeframe]);

  const zones = useMemo(() => (settings.zones ? detectZones(candles) : []), [candles, settings.zones]);
  const fmt = (v: number) => v.toFixed(digits);
  const lows = Math.min(...candles.map((c) => c.low));
  const highs = Math.max(...candles.map((c) => c.high));
  const pad = (highs - lows) * 0.08;

  return (
    <div className="space-y-2">
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} syncId="tv">
            <CartesianGrid stroke={GRID} strokeDasharray="2 4" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} minTickGap={40} />
            <YAxis
              orientation="right"
              domain={[lows - pad, highs + pad]}
              tickFormatter={(v: number) => fmt(v)}
              tickLine={false}
              axisLine={false}
              fontSize={11}
              width={72}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: any, name: string) => {
                if (name === "range" && Array.isArray(value))
                  return [`${fmt(value[0])} – ${fmt(value[1])}`, "L / H"];
                return [typeof value === "number" ? fmt(value) : value, name];
              }}
            />

            {zones.map((z) => (
              <ReferenceArea
                key={`${z.type}-${z.time}`}
                y1={z.from}
                y2={z.to}
                fill={z.type === "supply" ? DOWN : UP}
                fillOpacity={0.12}
                stroke={z.type === "supply" ? DOWN : UP}
                strokeOpacity={0.35}
                strokeDasharray="4 4"
              />
            ))}

            {settings.type === "area" ? (
              <Line
                type="monotone"
                dataKey="close"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={false}
                name="Close"
              />
            ) : (
              <Bar
                dataKey="range"
                shape={settings.type === "candles" ? <CandleShape /> : <BarShape />}
                isAnimationActive={false}
                name="range"
              />
            )}

            {settings.ema20 && (
              <Line type="monotone" dataKey="ema20" stroke="var(--color-primary)" strokeWidth={1.6} dot={false} connectNulls name="EMA 20" />
            )}
            {settings.ema50 && (
              <Line type="monotone" dataKey="ema50" stroke="#f59e0b" strokeWidth={1.6} dot={false} connectNulls name="EMA 50" />
            )}
            {settings.ema200 && (
              <Line type="monotone" dataKey="ema200" stroke="#6366f1" strokeWidth={1.6} dot={false} connectNulls name="EMA 200" />
            )}

            <Brush
              dataKey="label"
              height={22}
              travellerWidth={8}
              stroke="var(--color-primary)"
              fill="var(--color-secondary)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {settings.volume && (
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} syncId="tv">
              <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="label" hide />
              <YAxis orientation="right" tickLine={false} axisLine={false} fontSize={10} width={72} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="volume" name="Objem" isAnimationActive={false}>
                {rows.map((r) => (
                  <Cell key={r.time} fill={r.close >= r.open ? UP : DOWN} fillOpacity={0.45} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {settings.rsi && (
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} syncId="tv">
              <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="label" hide />
              <YAxis orientation="right" domain={[0, 100]} ticks={[30, 50, 70]} tickLine={false} axisLine={false} fontSize={10} width={72} />
              <Tooltip contentStyle={tooltipStyle} />
              <ReferenceLine y={70} stroke={DOWN} strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke={UP} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="rsi" stroke="var(--color-primary)" strokeWidth={1.8} dot={false} connectNulls name="RSI 14" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {settings.macd && (
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} syncId="tv">
              <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="label" hide />
              <YAxis orientation="right" tickLine={false} axisLine={false} fontSize={10} width={72} />
              <Tooltip contentStyle={tooltipStyle} />
              <ReferenceLine y={0} stroke={GRID} />
              <Bar dataKey="hist" name="Histogram" isAnimationActive={false}>
                {rows.map((r) => (
                  <Cell key={r.time} fill={(r.hist ?? 0) >= 0 ? UP : DOWN} fillOpacity={0.5} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="macd" stroke="var(--color-primary)" strokeWidth={1.6} dot={false} connectNulls name="MACD" />
              <Line type="monotone" dataKey="signal" stroke="#f59e0b" strokeWidth={1.6} dot={false} connectNulls name="Signal" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

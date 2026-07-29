import { useEffect, useRef } from "react";
import {
  AreaSeries,
  BarSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

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

/** oklch(L C H [/ a]) -> rgb(...) — canvas nevie oklch parsovať. */
function oklchToRgb(str: string): string | null {
  const m = str.match(/^oklch\(\s*([\d.%]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)$/i);
  if (!m) return null;
  const L = m[1].endsWith("%") ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
  const C = parseFloat(m[2]);
  const H = (parseFloat(m[3]) * Math.PI) / 180;
  const a = m[4] ? (m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4])) : 1;

  const l_ = L + 0.3963377774 * (C * Math.cos(H)) + 0.2158037573 * (C * Math.sin(H));
  const m_ = L - 0.1055613458 * (C * Math.cos(H)) - 0.0638541728 * (C * Math.sin(H));
  const s_ = L - 0.0894841775 * (C * Math.cos(H)) - 1.291485548 * (C * Math.sin(H));
  const l = l_ ** 3;
  const mm = m_ ** 3;
  const ss = s_ ** 3;

  const lin = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * ss,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * ss,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * ss,
  ];
  const toSrgb = (v: number) => {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, c)) * 255);
  };
  const [r, g, b] = lin.map(toSrgb);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Hodnota CSS premennej prevedená na rgba(), ktorej rozumie canvas. */
function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return fallback;
  if (raw.startsWith("oklch")) return oklchToRgb(raw) ?? fallback;
  const probe = document.createElement("span");
  probe.style.color = raw;
  probe.style.display = "none";
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  if (resolved.startsWith("oklch")) return oklchToRgb(resolved) ?? fallback;
  return resolved || fallback;
}

/** rgb(a) -> rgba s inou priehľadnosťou */
function alpha(color: string, a: number) {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return color;
  const [r, g, b] = m[1].split(",").map((x) => parseFloat(x));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export default function TradingChart({
  candles,
  settings,
  height = 520,
}: {
  candles: Candle[];
  settings: ChartSettings;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const text = cssVar("--color-muted-foreground", "#64748b");
    const grid = cssVar("--color-border", "#e2e8f0");
    const up = cssVar("--color-success", "#16a34a");
    const down = cssVar("--color-destructive", "#dc2626");
    const primary = cssVar("--color-primary", "#0d9488");

    const chart = createChart(el, {
      width: el.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "rgba(0,0,0,0)" },
        textColor: text,
        fontFamily: "inherit",
        attributionLogo: false,
        panes: { separatorColor: grid, separatorHoverColor: grid },
      },
      grid: {
        vertLines: { color: grid, style: LineStyle.Dotted },
        horzLines: { color: grid, style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: text, width: 1, style: LineStyle.Dashed, labelBackgroundColor: primary },
        horzLine: { color: text, width: 1, style: LineStyle.Dashed, labelBackgroundColor: primary },
      },
      rightPriceScale: { borderColor: grid },
      timeScale: { borderColor: grid, timeVisible: true, secondsVisible: false },
    });
    chartRef.current = chart;

    const time = (c: Candle) => c.time as UTCTimestamp;
    const closes = candles.map((c) => c.close);

    let main: ISeriesApi<"Candlestick" | "Bar" | "Area">;
    if (settings.type === "candles") {
      main = chart.addSeries(CandlestickSeries, {
        upColor: up,
        downColor: down,
        borderUpColor: up,
        borderDownColor: down,
        wickUpColor: up,
        wickDownColor: down,
      }) as ISeriesApi<"Candlestick">;
      main.setData(candles.map((c) => ({ time: time(c), open: c.open, high: c.high, low: c.low, close: c.close })));
    } else if (settings.type === "bars") {
      main = chart.addSeries(BarSeries, { upColor: up, downColor: down }) as ISeriesApi<"Bar">;
      main.setData(candles.map((c) => ({ time: time(c), open: c.open, high: c.high, low: c.low, close: c.close })));
    } else {
      main = chart.addSeries(AreaSeries, {
        lineColor: primary,
        topColor: alpha(primary, 0.35),
        bottomColor: alpha(primary, 0),
        lineWidth: 2,
      }) as ISeriesApi<"Area">;
      main.setData(candles.map((c) => ({ time: time(c), value: c.close })));
    }

    const addEma = (period: number, color: string) => {
      const values = ema(closes, period);
      const s = chart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      s.setData(
        candles
          .map((c, i) => ({ time: time(c), value: values[i] }))
          .filter((d): d is { time: UTCTimestamp; value: number } => d.value != null),
      );
    };
    if (settings.ema20) addEma(20, primary);
    if (settings.ema50) addEma(50, "#f59e0b");
    if (settings.ema200) addEma(200, "#6366f1");

    if (settings.volume) {
      const vol = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
      });
      vol.setData(
        candles.map((c) => ({
          time: time(c),
          value: c.volume,
          color: c.close >= c.open ? alpha(up, 0.35) : alpha(down, 0.35),
        })),
      );
      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    }

    if (settings.zones) {
      for (const z of detectZones(candles)) {
        main.createPriceLine({
          price: (z.from + z.to) / 2,
          color: z.type === "supply" ? down : up,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: z.type === "supply" ? "Supply" : "Demand",
        });
      }
    }

    let pane = 1;
    if (settings.rsi) {
      const values = rsi(closes);
      const s = chart.addSeries(LineSeries, { color: primary, lineWidth: 2, priceLineVisible: false }, pane);
      s.setData(
        candles
          .map((c, i) => ({ time: time(c), value: values[i] }))
          .filter((d): d is { time: UTCTimestamp; value: number } => d.value != null),
      );
      [70, 30].forEach((lvl) =>
        s.createPriceLine({
          price: lvl,
          color: grid,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `RSI ${lvl}`,
        }),
      );
      chart.panes()[pane]?.setHeight(110);
      pane++;
    }

    if (settings.macd) {
      const m = macd(closes);
      const hist = chart.addSeries(HistogramSeries, { priceLineVisible: false }, pane);
      hist.setData(
        candles
          .map((c, i) => ({
            time: time(c),
            value: m.hist[i],
            color: (m.hist[i] ?? 0) >= 0 ? alpha(up, 0.6) : alpha(down, 0.6),
          }))
          .filter((d): d is { time: UTCTimestamp; value: number; color: string } => d.value != null),
      );
      const line = chart.addSeries(LineSeries, { color: primary, lineWidth: 2, priceLineVisible: false }, pane);
      line.setData(
        candles
          .map((c, i) => ({ time: time(c), value: m.line[i] }))
          .filter((d): d is { time: UTCTimestamp; value: number } => d.value != null),
      );
      const sig = chart.addSeries(LineSeries, { color: "#f59e0b", lineWidth: 2, priceLineVisible: false }, pane);
      sig.setData(
        candles
          .map((c, i) => ({ time: time(c), value: m.signal[i] }))
          .filter((d): d is { time: UTCTimestamp; value: number } => d.value != null),
      );
      chart.panes()[pane]?.setHeight(110);
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      chart.resize(el.clientWidth, el.clientHeight || height);
      chart.timeScale().fitContent();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, settings, height]);

  return <div ref={containerRef} style={{ height }} className="w-full" />;
}

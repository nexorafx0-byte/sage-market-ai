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

function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
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
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
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
        topColor: primary,
        bottomColor: "transparent",
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
          color: c.close >= c.open ? `${up}55` : `${down}55`,
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
            color: (m.hist[i] ?? 0) >= 0 ? `${up}99` : `${down}99`,
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

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, settings]);

  return <div ref={containerRef} style={{ height }} className="w-full" />;
}

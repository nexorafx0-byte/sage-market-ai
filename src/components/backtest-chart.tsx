import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  LineStyle,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";

import type { BacktestSymbolId, Candle, Direction, Drawing, DrawingPoint, SimulatedTrade } from "@/lib/backtest-types";

export type ChartTool = "select" | "trend" | "zone";
export type ChartLevels = { entry: number; stopLoss: number; takeProfit: number; direction: Direction };

type Props = {
  candles: Candle[];
  symbol: BacktestSymbolId;
  trades: SimulatedTrade[];
  drawings: Drawing[];
  tool: ChartTool;
  levels: ChartLevels | null;
  datasetKey: string;
  onCreateDrawing: (drawing: Omit<Drawing, "id">) => void;
};

const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export default function BacktestChart({ candles, symbol, trades, drawings, tool, levels, datasetKey, onCreateDrawing }: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const createDrawingRef = useRef(onCreateDrawing);
  const [ready, setReady] = useState(false);
  const [, setOverlayVersion] = useState(0);
  const [draft, setDraft] = useState<DrawingPoint | null>(null);
  const [cursor, setCursor] = useState<DrawingPoint | null>(null);
  createDrawingRef.current = onCreateDrawing;

  useEffect(() => {
    const element = holder.current;
    if (!element) return;
    const primary = token("--primary");
    const destructive = token("--destructive");
    const chart = createChart(element, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: token("--muted-foreground"),
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: token("--border") },
        horzLines: { color: token("--border") },
      },
      rightPriceScale: { borderColor: token("--border") },
      timeScale: { borderColor: token("--border"), timeVisible: true, secondsVisible: false, rightOffset: 4 },
      crosshair: {
        vertLine: { color: primary, labelBackgroundColor: primary },
        horzLine: { color: primary, labelBackgroundColor: primary },
      },
      localization: { locale: "en-GB" },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: primary,
      downColor: destructive,
      wickUpColor: primary,
      wickDownColor: destructive,
      borderVisible: false,
      priceLineColor: primary,
    });
    chartRef.current = chart;
    seriesRef.current = series;
    markersRef.current = createSeriesMarkers(series, []);
    const refreshOverlay = () => setOverlayVersion((value) => value + 1);
    chart.timeScale().subscribeVisibleLogicalRangeChange(refreshOverlay);
    chart.subscribeCrosshairMove(refreshOverlay);
    setReady(true);
    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(refreshOverlay);
      chart.unsubscribeCrosshairMove(refreshOverlay);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;
    series.setData(candles.map((candle) => ({ ...candle, time: candle.time as UTCTimestamp })));
    chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, candles.length - 90), to: Math.max(90, candles.length + 4) });
    setOverlayVersion((value) => value + 1);
  }, [datasetKey]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    series.setData(candles.map((candle) => ({ ...candle, time: candle.time as UTCTimestamp })));
    setOverlayVersion((value) => value + 1);
  }, [candles]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    priceLinesRef.current.forEach((line) => series.removePriceLine(line));
    priceLinesRef.current = [];
    if (levels && candles.length) {
      const primary = token("--primary");
      const destructive = token("--destructive");
      const warning = token("--warning");
      const muted = token("--muted-foreground");
      const options = [
        { price: levels.entry, color: muted, title: "ENTRY", style: LineStyle.Dashed },
        { price: levels.stopLoss, color: destructive, title: "SL", style: LineStyle.Dashed },
        { price: levels.takeProfit, color: primary, title: "TP", style: LineStyle.Dashed },
      ];
      if (levels.stopLoss <= 0 || levels.takeProfit <= 0 || levels.entry <= 0) return;
      priceLinesRef.current = options.map((option) => series.createPriceLine({
        ...option,
        lineWidth: 1,
        axisLabelVisible: true,
        lineVisible: true,
      }));
      void warning;
    }
  }, [levels, candles.length, symbol]);

  useEffect(() => {
    if (!markersRef.current) return;
    const lastTime = candles.at(-1)?.time ?? 0;
    const primary = token("--primary");
    const destructive = token("--destructive");
    const markers: SeriesMarker<UTCTimestamp>[] = [];
    for (const trade of trades) {
      if (trade.entryTime > lastTime) continue;
      markers.push({
        time: trade.entryTime as UTCTimestamp,
        position: trade.direction === "buy" ? "belowBar" : "aboveBar",
        color: trade.direction === "buy" ? primary : destructive,
        shape: trade.direction === "buy" ? "arrowUp" : "arrowDown",
        text: trade.direction.toUpperCase(),
      });
      if (trade.status === "closed" && trade.exitTime != null && trade.exitTime <= lastTime) {
        markers.push({
          time: trade.exitTime as UTCTimestamp,
          position: trade.direction === "buy" ? "aboveBar" : "belowBar",
          color: (trade.pnl ?? 0) >= 0 ? primary : destructive,
          shape: "circle",
          text: trade.closeReason === "take_profit" ? "TP" : trade.closeReason === "stop_loss" ? "SL" : "CLOSE",
        });
      }
    }
    markers.sort((a, b) => Number(a.time) - Number(b.time));
    markersRef.current.setMarkers(markers);
  }, [trades, candles]);

  const chartPoint = (event: React.MouseEvent<HTMLDivElement>): DrawingPoint | null => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return null;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const time = chart.timeScale().coordinateToTime(x);
    const price = series.coordinateToPrice(y);
    if (typeof time !== "number" || price == null) return null;
    return { time, price };
  };

  const clickDrawing = (event: React.MouseEvent<HTMLDivElement>) => {
    if (tool === "select") return;
    const point = chartPoint(event);
    if (!point) return;
    if (!draft) {
      setDraft(point);
      setCursor(point);
      return;
    }
    createDrawingRef.current({ type: tool, from: draft, to: point });
    setDraft(null);
    setCursor(null);
  };

  const pixelPoint = (point: DrawingPoint) => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series || !ready) return null;
    const x = chart.timeScale().timeToCoordinate(point.time as UTCTimestamp);
    const y = series.priceToCoordinate(point.price);
    return x == null || y == null ? null : { x, y };
  };

  const renderDrawing = (drawing: Omit<Drawing, "id">, key: string) => {
    const from = pixelPoint(drawing.from);
    const to = pixelPoint(drawing.to);
    if (!from || !to) return null;
    const color = token("--primary");
    return drawing.type === "trend" ? (
      <line key={key} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth="2" />
    ) : (
      <rect key={key} x={Math.min(from.x, to.x)} y={Math.min(from.y, to.y)} width={Math.abs(to.x - from.x)} height={Math.abs(to.y - from.y)} fill={color} fillOpacity="0.12" stroke={color} strokeOpacity="0.75" />
    );
  };

  return (
    <div className="relative h-[420px] w-full overflow-hidden sm:h-[540px]">
      <div ref={holder} className="absolute inset-0" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        {drawings.map((drawing) => renderDrawing(drawing, drawing.id))}
        {draft && cursor && tool !== "select" && renderDrawing({ type: tool, from: draft, to: cursor }, "draft")}
      </svg>
      {tool !== "select" && (
        <div
          role="application"
          aria-label={`${tool} drawing surface. Click two points.`}
          className="absolute inset-0 cursor-crosshair"
          onClick={clickDrawing}
          onMouseMove={(event) => setCursor(chartPoint(event))}
          onMouseLeave={() => setCursor(null)}
        >
          <span className="pointer-events-none absolute left-3 top-3 rounded-md border border-border bg-card/90 px-2.5 py-1.5 text-[11px] text-muted-foreground">
            {draft ? "Click the second point · Esc cancels" : `Click two chart points to draw a ${tool === "trend" ? "trend line" : "zone"}`}
          </span>
        </div>
      )}
    </div>
  );
}

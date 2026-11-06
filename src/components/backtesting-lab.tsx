import { ClientOnly, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Box,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Eraser,
  Loader2,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  Save,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { PageHeader, Panel, Stat } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import {
  calculateBacktestStats,
  closeSimulatedTrade,
  evaluateTradesRange,
  lotSizeForRisk,
  openSimulatedTrade,
  quoteTrade,
  rewindTradesToTime,
} from "@/lib/backtest-engine";
import { getBacktestHistory } from "@/lib/backtest-data.functions";
import {
  BACKTEST_SYMBOLS,
  BACKTEST_TIMEFRAMES,
  formatMoney,
  formatPrice,
  getSymbolMeta,
  getTimeframeMeta,
  type BacktestSettings,
  type BacktestSymbolId,
  type BacktestTimeframe,
  type Candle,
  type DataMode,
  type Direction,
  type Drawing,
  type SavedBacktest,
  type SimulatedTrade,
} from "@/lib/backtest-types";
import { clampReplayIndex, replayDelayMs, replayIndexForDate, visibleCandles } from "@/lib/replay-engine";
import { cn } from "@/lib/utils";
import type { ChartLevels, ChartTool } from "@/components/backtest-chart";

const BacktestChart = lazy(() => import("@/components/backtest-chart"));
const LOCAL_KEY = "mm-backtesting-lab-v1";

type Ticket = { direction: Direction; entryPrice: number; stopLoss: number; takeProfit: number; lotSize: number };
type HistoryConfig = { symbol: BacktestSymbolId; timeframe: BacktestTimeframe; startDate: string; endDate: string };
type BacktestRow = Database["public"]["Tables"]["backtests"]["Row"];

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultSettings(timeframe: BacktestTimeframe = "M15"): BacktestSettings {
  const end = new Date();
  const start = new Date(end.getTime() - Math.min(30, getTimeframeMeta(timeframe).maxRangeDays - 1) * 86400000);
  return {
    startDate: isoDate(start),
    endDate: isoDate(end),
    initialCapital: 10_000,
    riskMode: "percent",
    riskValue: 1,
    spread: 0.6,
    commission: 3.5,
    slippage: 0.2,
    autoSize: true,
  };
}

function ticketAt(candle: Candle, symbol: BacktestSymbolId, direction: Direction, entry = candle.close): Ticket {
  const pip = getSymbolMeta(symbol).pipSize;
  const sign = direction === "buy" ? 1 : -1;
  return {
    direction,
    entryPrice: entry,
    stopLoss: entry - sign * pip * 20,
    takeProfit: entry + sign * pip * 40,
    lotSize: 0.1,
  };
}

function savedFromRow(row: BacktestRow): SavedBacktest {
  return {
    id: row.id,
    name: row.name,
    symbol: row.symbol as BacktestSymbolId,
    timeframe: row.timeframe as BacktestTimeframe,
    settings: row.settings as unknown as BacktestSettings,
    trades: row.trades as unknown as SimulatedTrade[],
    stats: row.stats as unknown as SavedBacktest["stats"],
    drawings: row.drawings as unknown as Drawing[],
    notes: row.notes,
    replayIndex: row.replay_index,
    dataMode: row.data_mode as DataMode,
    updatedAt: row.updated_at,
  };
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={cn("min-w-0 space-y-1.5 text-xs font-medium text-muted-foreground", className)}><span>{label}</span>{children}</label>;
}

const selectClass = "h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring";

export default function BacktestingLab() {
  const [symbol, setSymbol] = useState<BacktestSymbolId>("EURUSD");
  const [timeframe, setTimeframe] = useState<BacktestTimeframe>("M15");
  const [settings, setSettings] = useState<BacktestSettings>(() => defaultSettings());
  const [candles, setCandles] = useState<Candle[]>([]);
  const [dataMode, setDataMode] = useState<DataMode>("demo");
  const [source, setSource] = useState("Waiting for historical data");
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [datasetKey, setDatasetKey] = useState("initial");
  const [replayIndex, setReplayIndex] = useState(0);
  const [replayDate, setReplayDate] = useState(settings.startDate);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [trades, setTrades] = useState<SimulatedTrade[]>([]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [tool, setTool] = useState<ChartTool>("select");
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("EURUSD strategy test");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<Ticket>({ direction: "buy", entryPrice: 0, stopLoss: 0, takeProfit: 0, lotSize: 0.1 });
  const [ticketTouched, setTicketTouched] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [savedRuns, setSavedRuns] = useState<SavedBacktest[]>([]);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const initialized = useRef(false);

  const currentCandle = candles[replayIndex] as Candle | undefined;
  const shownCandles = useMemo(() => visibleCandles(candles, replayIndex), [candles, replayIndex]);
  const openTrade = trades.find((trade) => trade.status === "open");
  const stats = useMemo(() => calculateBacktestStats(settings.initialCapital, trades), [settings.initialCapital, trades]);
  const ticketQuote = useMemo(() => quoteTrade({ symbol, ...ticket, settings }), [symbol, ticket, settings]);
  const levels: ChartLevels | null = openTrade ? {
    entry: openTrade.entryPrice,
    stopLoss: openTrade.stopLoss,
    takeProfit: openTrade.takeProfit,
    direction: openTrade.direction,
  } : ticket.entryPrice > 0 ? {
    entry: ticket.entryPrice,
    stopLoss: ticket.stopLoss,
    takeProfit: ticket.takeProfit,
    direction: ticket.direction,
  } : null;

  const loadHistory = useCallback(async (config: HistoryConfig, options: { reset: boolean; replayIndex?: number }) => {
    setLoading(true);
    setPlaying(false);
    try {
      const result = await getBacktestHistory({ data: config });
      setCandles(result.candles);
      setDataMode(result.mode);
      setSource(result.source);
      setNotice(result.notice);
      const requestedIndex = options.replayIndex ?? 0;
      setReplayIndex(clampReplayIndex(result.candles.length, requestedIndex));
      setReplayDate(config.startDate);
      setDatasetKey(`${config.symbol}-${config.timeframe}-${config.startDate}-${config.endDate}-${Date.now()}`);
      if (options.reset) {
        setTrades([]);
        setDrawings([]);
        setNotes("");
        setCurrentId(null);
        setTicketTouched(false);
      }
    } catch {
      setCandles([]);
      setDataMode("demo");
      setNotice("Historical data could not be loaded. Check the date range and try again.");
      setSource("No candles loaded");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSavedRuns = useCallback(async (id: string) => {
    const { data, error } = await supabase.from("backtests").select("*").eq("user_id", id).order("updated_at", { ascending: false });
    if (!error && data) setSavedRuns(data.map(savedFromRow));
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    let config: HistoryConfig = { symbol, timeframe, startDate: settings.startDate, endDate: settings.endDate };
    let restoredIndex = 0;
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<SavedBacktest>;
        if (draft.settings && draft.symbol && draft.timeframe) {
          setSymbol(draft.symbol);
          setTimeframe(draft.timeframe);
          setSettings(draft.settings);
          setTrades(draft.trades ?? []);
          setDrawings(draft.drawings ?? []);
          setNotes(draft.notes ?? "");
          setName(draft.name ?? `${draft.symbol} strategy test`);
          setCurrentId(draft.id ?? null);
          restoredIndex = draft.replayIndex ?? 0;
          config = { symbol: draft.symbol, timeframe: draft.timeframe, startDate: draft.settings.startDate, endDate: draft.settings.endDate };
        }
      }
    } catch {
      localStorage.removeItem(LOCAL_KEY);
    }
    setTicketTouched(false);
    setDraftReady(true);
    void loadHistory(config, { reset: false, replayIndex: restoredIndex });
    void supabase.auth.getSession().then(({ data }) => {
      const id = data.session?.user.id ?? null;
      setUserId(id);
      if (id) void refreshSavedRuns(id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.id ?? null;
      setUserId(id);
      if (id) void refreshSavedRuns(id);
      else setSavedRuns([]);
    });
    return () => listener.subscription.unsubscribe();
  }, [loadHistory, refreshSavedRuns]);

  useEffect(() => {
    if (!draftReady) return;
    const draft: SavedBacktest = {
      id: currentId ?? "local-draft",
      name,
      symbol,
      timeframe,
      settings,
      trades,
      stats,
      drawings,
      notes,
      replayIndex,
      dataMode,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(draft));
  }, [draftReady, currentId, name, symbol, timeframe, settings, trades, stats, drawings, notes, replayIndex, dataMode]);

  useEffect(() => {
    if (!currentCandle || openTrade || ticketTouched) return;
    setTicket(ticketAt(currentCandle, symbol, ticket.direction));
  }, [currentCandle, openTrade, ticketTouched, symbol, ticket.direction]);

  const goReplay = useCallback((requested: number) => {
    const next = clampReplayIndex(candles.length, requested);
    if (next < 0 || next === replayIndex) return;
    const nextCandle = candles[next];
    if (next > replayIndex) {
      setTrades((current) => evaluateTradesRange(current, candles, replayIndex + 1, next, settings));
    } else {
      setTrades((current) => rewindTradesToTime(current, nextCandle.time));
    }
    setReplayIndex(next);
    setTicketTouched(false);
  }, [candles, replayIndex, settings]);

  useEffect(() => {
    if (!playing) return;
    if (replayIndex >= candles.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => goReplay(replayIndex + 1), replayDelayMs(speed));
    return () => window.clearTimeout(timer);
  }, [playing, replayIndex, candles.length, speed, goReplay]);

  const updateNumber = (key: keyof BacktestSettings, value: string) => {
    setSettings((current) => ({ ...current, [key]: Number(value) }));
  };

  const changeTimeframe = (value: BacktestTimeframe) => {
    setTimeframe(value);
    const dates = defaultSettings(value);
    setSettings((current) => ({ ...current, startDate: dates.startDate, endDate: dates.endDate }));
  };

  const resetTicket = () => {
    if (!currentCandle) return;
    setTicket(ticketAt(currentCandle, symbol, ticket.direction));
    setTicketTouched(false);
  };

  const chooseDirection = (direction: Direction) => {
    if (!currentCandle) return;
    setTicket(ticketAt(currentCandle, symbol, direction, ticket.entryPrice || currentCandle.close));
    setTicketTouched(false);
  };

  const openPosition = (direction: Direction) => {
    if (!currentCandle) return;
    if (openTrade) {
      toast.error("Close the current simulated position first.");
      return;
    }
    let nextTicket = { ...ticket, direction };
    const validForDirection = direction === "buy"
      ? ticket.stopLoss < ticket.entryPrice && ticket.takeProfit > ticket.entryPrice
      : ticket.stopLoss > ticket.entryPrice && ticket.takeProfit < ticket.entryPrice;
    if (!validForDirection) nextTicket = ticketAt(currentCandle, symbol, direction, ticket.entryPrice || currentCandle.close);
    const lotSize = settings.autoSize ? lotSizeForRisk({ symbol, ...nextTicket, settings, equity: stats.endingEquity }) : nextTicket.lotSize;
    try {
      const trade = openSimulatedTrade({
        id: crypto.randomUUID(),
        symbol,
        ...nextTicket,
        lotSize,
        time: currentCandle.time,
        settings,
      });
      setTrades((current) => [...current, trade]);
      setTicket({ ...nextTicket, lotSize });
      setTicketTouched(true);
      toast.success(`${direction.toUpperCase()} ${symbol} opened at ${formatPrice(trade.entryPrice, symbol)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Trade ticket is invalid.");
    }
  };

  const closePosition = () => {
    if (!openTrade || !currentCandle) return;
    const closed = closeSimulatedTrade({ trade: openTrade, time: currentCandle.time, rawExitPrice: currentCandle.close, reason: "manual", settings });
    setTrades((current) => current.map((trade) => trade.id === closed.id ? closed : trade));
    setTicketTouched(false);
    toast.success(`Position closed · ${formatMoney(closed.pnl ?? 0)}`);
  };

  const newBacktest = () => {
    setPlaying(false);
    setTrades([]);
    setDrawings([]);
    setNotes("");
    setCurrentId(null);
    setName(`${symbol} strategy test`);
    setReplayIndex(0);
    setTicketTouched(false);
    toast.success("New backtest started. Historical data stays loaded.");
  };

  const saveToCloud = async () => {
    if (!userId) {
      toast.error("Sign in to save this backtest to your private cloud library.");
      return;
    }
    setCloudBusy(true);
    try {
      const payload = {
        id: currentId ?? undefined,
        user_id: userId,
        name: name.trim() || `${symbol} backtest`,
        symbol,
        timeframe,
        settings: settings as unknown as Json,
        trades: trades as unknown as Json,
        stats: stats as unknown as Json,
        drawings: drawings as unknown as Json,
        notes,
        replay_index: replayIndex,
        data_mode: dataMode,
      };
      const { data, error } = await supabase.from("backtests").upsert(payload).select().single();
      if (error) throw error;
      setCurrentId(data.id);
      await refreshSavedRuns(userId);
      toast.success("Backtest saved to your private library.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Backtest could not be saved.");
    } finally {
      setCloudBusy(false);
    }
  };

  const loadSavedRun = (run: SavedBacktest) => {
    setSymbol(run.symbol);
    setTimeframe(run.timeframe);
    setSettings(run.settings);
    setTrades(run.trades);
    setDrawings(run.drawings);
    setNotes(run.notes);
    setName(run.name);
    setCurrentId(run.id);
    setTicketTouched(false);
    void loadHistory({ symbol: run.symbol, timeframe: run.timeframe, startDate: run.settings.startDate, endDate: run.settings.endDate }, { reset: false, replayIndex: run.replayIndex });
    toast.success(`Loaded ${run.name}`);
  };

  const deleteSavedRun = async (run: SavedBacktest) => {
    if (!userId) return;
    const { error } = await supabase.from("backtests").delete().eq("id", run.id).eq("user_id", userId);
    if (error) toast.error("Saved backtest could not be deleted.");
    else {
      if (currentId === run.id) setCurrentId(null);
      await refreshSavedRuns(userId);
      toast.success("Saved backtest deleted.");
    }
  };

  const visibleTrades = currentCandle ? rewindTradesToTime(trades, currentCandle.time) : [];
  const currentPrice = currentCandle ? formatPrice(currentCandle.close, symbol) : "—";

  return (
    <>
      <PageHeader
        title="Backtesting Lab"
        subtitle="Bar-by-bar strategy rehearsal with simulated execution and private saved runs"
        actions={<div className="flex flex-wrap items-center gap-2">
          <Badge variant={dataMode === "real" ? "default" : "destructive"}>{dataMode === "real" ? "REAL DATA" : "DEMO MODE"}</Badge>
          <Button variant="outline" onClick={newBacktest}><RotateCcw />New</Button>
          <Button onClick={() => void saveToCloud()} disabled={cloudBusy}>{cloudBusy ? <Loader2 className="animate-spin" /> : <Cloud />}Save to cloud</Button>
        </div>}
      />

      <div className="space-y-5 p-4 sm:p-6">
        <Panel title="Market & backtest setup" hint="Load a new dataset before starting a different simulation">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            <Field label="Market"><select aria-label="Backtest market" className={selectClass} value={symbol} onChange={(event) => { const value = event.target.value as BacktestSymbolId; setSymbol(value); setName(`${value} strategy test`); setTicketTouched(false); }}>{BACKTEST_SYMBOLS.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.label}</option>)}</select></Field>
            <Field label="Timeframe"><select aria-label="Backtest timeframe" className={selectClass} value={timeframe} onChange={(event) => changeTimeframe(event.target.value as BacktestTimeframe)}>{BACKTEST_TIMEFRAMES.map((item) => <option key={item.id}>{item.id}</option>)}</select></Field>
            <Field label="Start date"><Input aria-label="Backtest start date" type="date" value={settings.startDate} max={settings.endDate} onChange={(event) => setSettings((current) => ({ ...current, startDate: event.target.value }))} /></Field>
            <Field label="End date"><Input aria-label="Backtest end date" type="date" value={settings.endDate} min={settings.startDate} onChange={(event) => setSettings((current) => ({ ...current, endDate: event.target.value }))} /></Field>
            <Field label="Initial capital (€)"><Input aria-label="Initial capital" type="number" min="100" step="100" value={settings.initialCapital} onChange={(event) => updateNumber("initialCapital", event.target.value)} /></Field>
            <Field label="Risk mode"><select aria-label="Risk mode" className={selectClass} value={settings.riskMode} onChange={(event) => setSettings((current) => ({ ...current, riskMode: event.target.value as BacktestSettings["riskMode"] }))}><option value="percent">% of equity</option><option value="fixed">Fixed €</option></select></Field>
            <Field label={settings.riskMode === "percent" ? "Risk per trade (%)" : "Risk per trade (€)"}><Input aria-label="Risk per trade" type="number" min="0.01" step="0.1" value={settings.riskValue} onChange={(event) => updateNumber("riskValue", event.target.value)} /></Field>
            <Field label="Spread (pips)"><Input aria-label="Spread" type="number" min="0" step="0.1" value={settings.spread} onChange={(event) => updateNumber("spread", event.target.value)} /></Field>
            <Field label="Commission (€ / lot / side)"><Input aria-label="Commission" type="number" min="0" step="0.5" value={settings.commission} onChange={(event) => updateNumber("commission", event.target.value)} /></Field>
            <Field label="Slippage (pips)"><Input aria-label="Slippage" type="number" min="0" step="0.1" value={settings.slippage} onChange={(event) => updateNumber("slippage", event.target.value)} /></Field>
            <label className="col-span-2 flex min-h-9 items-center gap-2 self-end rounded-md border border-border px-3 py-2 text-xs text-muted-foreground md:col-span-1"><input type="checkbox" className="accent-primary" checked={settings.autoSize} onChange={(event) => setSettings((current) => ({ ...current, autoSize: event.target.checked }))} />Auto lot size from risk</label>
            <Button className="col-span-2 self-end md:col-span-1" onClick={() => void loadHistory({ symbol, timeframe, startDate: settings.startDate, endDate: settings.endDate }, { reset: true })} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <TrendingUp />}Load history</Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", dataMode === "real" ? "bg-success" : "bg-destructive")} />
            <span>{source}</span><span>·</span><span>{candles.length} candles loaded</span>
          </div>
          {notice && <div className="mt-3 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs leading-5 text-warning"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{notice}</div>}
        </Panel>

        <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_350px]">
          <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex items-baseline gap-3"><h2 className="font-mono text-lg font-semibold">{symbol}</h2><span className="text-xs text-muted-foreground">{timeframe}</span><span className="font-mono text-sm text-primary">{currentPrice}</span></div>
              <div className="flex items-center gap-1">
                {([{ id: "select", icon: MousePointer2, label: "Pan & zoom" }, { id: "trend", icon: TrendingUp, label: "Draw trend line" }, { id: "zone", icon: Box, label: "Draw zone" }] as const).map((item) => <Button key={item.id} type="button" size="sm" variant={tool === item.id ? "default" : "ghost"} aria-label={item.label} onClick={() => setTool(item.id)}><item.icon /></Button>)}
                <Button type="button" size="sm" variant="ghost" aria-label="Delete last drawing" disabled={!drawings.length} onClick={() => setDrawings((current) => current.slice(0, -1))}><Eraser /></Button>
                <Button type="button" size="sm" variant="ghost" aria-label="Clear all drawings" disabled={!drawings.length} onClick={() => setDrawings([])}><Trash2 /></Button>
              </div>
            </header>
            <ClientOnly fallback={<div className="flex h-[420px] items-center justify-center sm:h-[540px]"><Loader2 className="animate-spin text-primary" /></div>}>
              <Suspense fallback={<div className="flex h-[420px] items-center justify-center sm:h-[540px]"><Loader2 className="animate-spin text-primary" /></div>}>
                <BacktestChart candles={shownCandles} symbol={symbol} trades={visibleTrades} drawings={drawings} tool={tool} levels={levels} datasetKey={datasetKey} onCreateDrawing={(drawing) => setDrawings((current) => [...current, { ...drawing, id: crypto.randomUUID() }])} />
              </Suspense>
            </ClientOnly>
            <div className="space-y-3 border-t border-border p-4">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" size="sm" aria-label="Previous candle" disabled={!candles.length || replayIndex <= 0} onClick={() => { setPlaying(false); goReplay(replayIndex - 1); }}><ChevronLeft /></Button>
                <Button size="sm" className="min-w-24" aria-label={playing ? "Pause replay" : "Play replay"} disabled={!candles.length || replayIndex >= candles.length - 1} onClick={() => setPlaying((value) => !value)}>{playing ? <Pause /> : <Play />}{playing ? "Pause" : "Play"}</Button>
                <Button variant="outline" size="sm" aria-label="Next candle" disabled={!candles.length || replayIndex >= candles.length - 1} onClick={() => { setPlaying(false); goReplay(replayIndex + 1); }}><ChevronRight /></Button>
                <select aria-label="Replay speed" className={cn(selectClass, "ml-2 w-24")} value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option><option value="5">5×</option></select>
                <div className="ml-2 flex items-center gap-2"><Input aria-label="Replay date" type="date" className="w-36" value={replayDate} onChange={(event) => setReplayDate(event.target.value)} /><Button variant="outline" size="sm" onClick={() => { setPlaying(false); goReplay(replayIndexForDate(candles, replayDate)); }}>Seek</Button></div>
              </div>
              <input aria-label="Replay progress" type="range" className="w-full accent-primary" min="0" max={Math.max(0, candles.length - 1)} value={Math.max(0, replayIndex)} onChange={(event) => { setPlaying(false); goReplay(Number(event.target.value)); }} />
              <div className="flex justify-between gap-3 font-mono text-[11px] text-muted-foreground"><span>{currentCandle ? new Date(currentCandle.time * 1000).toLocaleString("en-GB") : "No candle"}</span><span>{replayIndex + 1} / {candles.length} · future hidden</span></div>
            </div>
          </section>

          <div className="space-y-5">
            <Panel title="Simulated trade ticket" hint="Spread, slippage and commission are included">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2"><Button variant={ticket.direction === "buy" ? "default" : "outline"} onClick={() => chooseDirection("buy")}>BUY setup</Button><Button variant={ticket.direction === "sell" ? "destructive" : "outline"} onClick={() => chooseDirection("sell")}>SELL setup</Button></div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Entry price"><Input aria-label="Trade entry price" type="number" step="any" value={ticket.entryPrice || ""} onChange={(event) => { setTicket((current) => ({ ...current, entryPrice: Number(event.target.value) })); setTicketTouched(true); }} /></Field>
                  <Field label="Lot size"><Input aria-label="Trade lot size" type="number" min="0.01" step="0.01" value={ticket.lotSize} disabled={settings.autoSize} onChange={(event) => { setTicket((current) => ({ ...current, lotSize: Number(event.target.value) })); setTicketTouched(true); }} /></Field>
                  <Field label="Stop Loss"><Input aria-label="Trade stop loss" type="number" step="any" value={ticket.stopLoss || ""} onChange={(event) => { setTicket((current) => ({ ...current, stopLoss: Number(event.target.value) })); setTicketTouched(true); }} /></Field>
                  <Field label="Take Profit"><Input aria-label="Trade take profit" type="number" step="any" value={ticket.takeProfit || ""} onChange={(event) => { setTicket((current) => ({ ...current, takeProfit: Number(event.target.value) })); setTicketTouched(true); }} /></Field>
                </div>
                <Button variant="ghost" size="sm" className="w-full" onClick={resetTicket}>Reset ticket to current close</Button>
                <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-background/40 p-3 text-center">
                  <div><p className="text-[10px] uppercase text-muted-foreground">Risk</p><p className="mt-1 font-mono text-sm">{formatMoney(ticketQuote.riskEur)}</p></div>
                  <div><p className="text-[10px] uppercase text-muted-foreground">Potential</p><p className="mt-1 font-mono text-sm text-success">{formatMoney(ticketQuote.potentialEur)}</p></div>
                  <div><p className="text-[10px] uppercase text-muted-foreground">R / R</p><p className="mt-1 font-mono text-sm">{ticketQuote.rr.toFixed(2)}</p></div>
                </div>
                {!ticketQuote.valid && <p className="text-xs text-destructive">Check entry, lot size and stop/target direction.</p>}
                <div className="grid grid-cols-2 gap-2"><Button disabled={Boolean(openTrade) || !currentCandle} onClick={() => openPosition("buy")}>BUY</Button><Button variant="destructive" disabled={Boolean(openTrade) || !currentCandle} onClick={() => openPosition("sell")}>SELL</Button></div>
                <Button variant="outline" className="w-full" disabled={!openTrade} onClick={closePosition}>CLOSE POSITION</Button>
                {openTrade && <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs"><div className="flex justify-between gap-3"><span className="font-semibold text-primary">{openTrade.direction.toUpperCase()} {openTrade.lotSize} lots</span><span className="font-mono">{formatPrice(openTrade.entryPrice, symbol)}</span></div><p className="mt-2 text-muted-foreground">Open since {new Date(openTrade.entryTime * 1000).toLocaleString("en-GB")}. Advance replay to evaluate SL / TP.</p></div>}
                <p className="text-[11px] leading-5 text-muted-foreground">Simulator contract values are fixed approximations in EUR. Verify your broker's pip value and contract size. If both SL and TP occur in one candle, SL is executed first.</p>
              </div>
            </Panel>

            <Panel title="Notes" hint="Saved with this backtest"><Textarea aria-label="Backtest notes" className="min-h-28" placeholder="Strategy rules, observations, mistakes…" value={notes} onChange={(event) => setNotes(event.target.value)} /></Panel>
          </div>
        </div>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Performance</h2><p className="text-xs text-muted-foreground">Closed simulated trades · ending equity {formatMoney(stats.endingEquity)}</p></div><span className={cn("font-mono text-lg", stats.netProfit >= 0 ? "text-success" : "text-destructive")}>{formatMoney(stats.netProfit)}</span></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <Stat label="Total trades" value={String(stats.totalTrades)} delta={`${stats.wins} W / ${stats.losses} L`} />
            <Stat label="Win rate" value={`${stats.winRate.toFixed(1)} %`} />
            <Stat label="Profit factor" value={stats.profitFactor == null ? "∞" : stats.profitFactor.toFixed(2)} />
            <Stat label="Net profit" value={formatMoney(stats.netProfit)} tone={stats.netProfit >= 0 ? "positive" : "negative"} />
            <Stat label="Gross profit" value={formatMoney(stats.grossProfit)} tone="positive" />
            <Stat label="Gross loss" value={formatMoney(stats.grossLoss)} tone="negative" />
            <Stat label="Maximum drawdown" value={formatMoney(stats.maxDrawdown)} delta={`${stats.maxDrawdownPct.toFixed(2)} % of initial capital`} tone="negative" />
            <Stat label="Average R" value={`${stats.averageR.toFixed(2)} R`} />
            <Stat label="Average win" value={formatMoney(stats.averageWin)} tone="positive" />
            <Stat label="Average loss" value={formatMoney(stats.averageLoss)} tone="negative" />
          </div>
        </section>

        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
          <Panel title="Equity curve" hint={`Starting capital ${formatMoney(settings.initialCapital)}`} className="min-w-0">
            <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={stats.equityCurve} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}><XAxis dataKey="time" tickFormatter={(value) => value === 0 ? "Start" : new Date(value * 1000).toLocaleDateString("en-GB")} stroke="var(--muted-foreground)" fontSize={11} /><YAxis domain={["auto", "auto"]} stroke="var(--muted-foreground)" fontSize={11} width={72} tickFormatter={(value) => `€${Math.round(value).toLocaleString()}`} /><Tooltip labelFormatter={(value) => value === 0 ? "Start" : new Date(Number(value) * 1000).toLocaleString("en-GB")} formatter={(value) => [formatMoney(Number(value)), "Equity"]} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }} /><ReferenceLine y={settings.initialCapital} stroke="var(--border)" strokeDasharray="4 4" /><Line type="monotone" dataKey="equity" stroke="var(--primary)" strokeWidth={2} dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>
          </Panel>

          <Panel title="Private cloud library" hint={userId ? "Only your saved backtests" : "Sign in to sync across devices"}>
            {!userId ? <div className="space-y-3 text-sm text-muted-foreground"><p>Your current draft is saved in this browser. Sign in to save settings, trades, results, drawings and notes to your private account.</p><Button asChild variant="outline"><Link to="/auth">Sign in to save</Link></Button></div> : savedRuns.length === 0 ? <p className="text-sm text-muted-foreground">No cloud backtests yet. Use Save to cloud above.</p> : <div className="space-y-2">{savedRuns.map((run) => <div key={run.id} className="flex items-center gap-2 rounded-md border border-border p-3"><button type="button" className="min-w-0 flex-1 text-left" onClick={() => loadSavedRun(run)}><span className="block truncate text-sm font-medium">{run.name}</span><span className="mt-1 block text-[11px] text-muted-foreground">{run.symbol} · {run.timeframe} · {new Date(run.updatedAt).toLocaleDateString("en-GB")}</span></button><Button variant="ghost" size="icon" aria-label={`Delete ${run.name}`} onClick={() => void deleteSavedRun(run)}><Trash2 /></Button></div>)}</div>}
          </Panel>
        </div>

        <Panel title="Simulated trade history" hint={`${trades.length} open and closed positions at the current replay point`}>
          {visibleTrades.length === 0 ? <p className="text-sm text-muted-foreground">No trades yet. Set your ticket, then select BUY or SELL.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="border-b border-border text-muted-foreground"><tr>{["Time", "Side", "Entry", "Stop Loss", "Take Profit", "Lots", "Risk", "Exit", "P & L", "Status"].map((heading) => <th key={heading} className="px-3 py-2 font-medium">{heading}</th>)}</tr></thead><tbody>{[...visibleTrades].reverse().map((trade) => <tr key={trade.id} className="border-b border-border/60 last:border-0"><td className="px-3 py-3 font-mono">{new Date(trade.entryTime * 1000).toLocaleString("en-GB")}</td><td className={cn("px-3 py-3 font-semibold", trade.direction === "buy" ? "text-success" : "text-destructive")}>{trade.direction.toUpperCase()}</td><td className="px-3 py-3 font-mono">{formatPrice(trade.entryPrice, trade.symbol)}</td><td className="px-3 py-3 font-mono">{formatPrice(trade.stopLoss, trade.symbol)}</td><td className="px-3 py-3 font-mono">{formatPrice(trade.takeProfit, trade.symbol)}</td><td className="px-3 py-3 font-mono">{trade.lotSize}</td><td className="px-3 py-3 font-mono">{formatMoney(trade.riskEur)}</td><td className="px-3 py-3 font-mono">{trade.exitPrice == null ? "—" : formatPrice(trade.exitPrice, trade.symbol)}</td><td className={cn("px-3 py-3 font-mono", (trade.pnl ?? 0) >= 0 ? "text-success" : "text-destructive")}>{trade.pnl == null ? "—" : formatMoney(trade.pnl)}</td><td className="px-3 py-3"><Badge variant={trade.status === "open" ? "outline" : "secondary"}>{trade.status === "open" ? "OPEN" : trade.closeReason?.replace("_", " ").toUpperCase()}</Badge></td></tr>)}</tbody></table></div>}
        </Panel>

        <p className="text-xs leading-5 text-muted-foreground">Backtesting is a simulation, not a promise of future performance. Yahoo data availability varies by market and timeframe; XAUUSD uses gold futures (GC=F), NASDAQ uses Nasdaq 100 and US30 uses Dow Jones. Generated DEMO MODE candles are never represented as real history. Your active draft is stored in this browser; cloud runs require sign-in.</p>
      </div>
    </>
  );
}

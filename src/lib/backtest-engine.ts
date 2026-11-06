import {
  getSymbolMeta,
  type BacktestSettings,
  type BacktestStats,
  type BacktestSymbolId,
  type Candle,
  type CloseReason,
  type Direction,
  type SimulatedTrade,
} from "./backtest-types";

const round2 = (value: number) => Math.round(value * 100) / 100;

export function tradeCostsPerLot(settings: BacktestSettings) {
  return settings.commission * 2;
}

export function quoteTrade({
  symbol,
  direction,
  entryPrice,
  stopLoss,
  takeProfit,
  lotSize,
  settings,
}: {
  symbol: BacktestSymbolId;
  direction: Direction;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  settings: BacktestSettings;
}) {
  const meta = getSymbolMeta(symbol);
  const validDirection = direction === "buy"
    ? stopLoss < entryPrice && takeProfit > entryPrice
    : stopLoss > entryPrice && takeProfit < entryPrice;
  const validNumbers = [entryPrice, stopLoss, takeProfit, lotSize].every(Number.isFinite) && entryPrice > 0 && lotSize > 0;
  const valid = validDirection && validNumbers;
  const riskGross = valid ? (Math.abs(entryPrice - stopLoss) / meta.pipSize) * meta.pipValueEur * lotSize : 0;
  const rewardGross = valid ? (Math.abs(takeProfit - entryPrice) / meta.pipSize) * meta.pipValueEur * lotSize : 0;
  const commission = tradeCostsPerLot(settings) * lotSize;
  const riskEur = riskGross + commission;
  const potentialEur = Math.max(0, rewardGross - commission);
  return {
    valid,
    riskEur: round2(riskEur),
    potentialEur: round2(potentialEur),
    rr: riskEur > 0 ? potentialEur / riskEur : 0,
    commission: round2(commission),
  };
}

export function lotSizeForRisk({
  symbol,
  direction,
  entryPrice,
  stopLoss,
  takeProfit,
  settings,
  equity,
}: {
  symbol: BacktestSymbolId;
  direction: Direction;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  settings: BacktestSettings;
  equity: number;
}) {
  const budget = settings.riskMode === "percent" ? equity * (settings.riskValue / 100) : settings.riskValue;
  const oneLot = quoteTrade({ symbol, direction, entryPrice, stopLoss, takeProfit, lotSize: 1, settings });
  if (!oneLot.valid || oneLot.riskEur <= 0 || budget <= 0) return 0.01;
  return Math.max(0.01, Math.floor((budget / oneLot.riskEur) * 100) / 100);
}

export function openSimulatedTrade({
  id,
  symbol,
  direction,
  time,
  entryPrice,
  stopLoss,
  takeProfit,
  lotSize,
  settings,
}: {
  id: string;
  symbol: BacktestSymbolId;
  direction: Direction;
  time: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  settings: BacktestSettings;
}): SimulatedTrade {
  const meta = getSymbolMeta(symbol);
  const entryAdjustment = (settings.spread / 2 + settings.slippage) * meta.pipSize;
  const adjustedEntry = direction === "buy" ? entryPrice + entryAdjustment : entryPrice - entryAdjustment;
  const quote = quoteTrade({ symbol, direction, entryPrice: adjustedEntry, stopLoss, takeProfit, lotSize, settings });
  if (!quote.valid) throw new Error(direction === "buy" ? "For BUY, Stop Loss must be below entry and Take Profit above it." : "For SELL, Stop Loss must be above entry and Take Profit below it.");
  return {
    id,
    symbol,
    direction,
    status: "open",
    entryTime: time,
    entryPrice: adjustedEntry,
    stopLoss,
    takeProfit,
    lotSize,
    ...quote,
  };
}

export function closeSimulatedTrade({
  trade,
  time,
  rawExitPrice,
  reason,
  settings,
}: {
  trade: SimulatedTrade;
  time: number;
  rawExitPrice: number;
  reason: CloseReason;
  settings: BacktestSettings;
}): SimulatedTrade {
  if (trade.status === "closed") return trade;
  const meta = getSymbolMeta(trade.symbol);
  const slippage = settings.slippage * meta.pipSize;
  const exitPrice = trade.direction === "buy" ? rawExitPrice - slippage : rawExitPrice + slippage;
  const direction = trade.direction === "buy" ? 1 : -1;
  const gross = ((exitPrice - trade.entryPrice) * direction / meta.pipSize) * meta.pipValueEur * trade.lotSize;
  const pnl = round2(gross - trade.commission);
  return {
    ...trade,
    status: "closed",
    exitTime: time,
    exitPrice,
    pnl,
    rMultiple: trade.riskEur > 0 ? pnl / trade.riskEur : 0,
    closeReason: reason,
  };
}

/** Evaluate exactly one newly revealed candle. If SL and TP share a bar, SL wins conservatively. */
export function evaluateTradeOnCandle(trade: SimulatedTrade, candle: Candle, settings: BacktestSettings): SimulatedTrade {
  if (trade.status === "closed" || candle.time <= trade.entryTime) return trade;
  const { stopLoss, takeProfit, direction } = trade;
  let rawExit: number | null = null;
  let reason: CloseReason | null = null;

  if (direction === "buy") {
    if (candle.open <= stopLoss) { rawExit = candle.open; reason = "stop_loss"; }
    else if (candle.open >= takeProfit) { rawExit = candle.open; reason = "take_profit"; }
    else if (candle.low <= stopLoss) { rawExit = stopLoss; reason = "stop_loss"; }
    else if (candle.high >= takeProfit) { rawExit = takeProfit; reason = "take_profit"; }
  } else {
    if (candle.open >= stopLoss) { rawExit = candle.open; reason = "stop_loss"; }
    else if (candle.open <= takeProfit) { rawExit = candle.open; reason = "take_profit"; }
    else if (candle.high >= stopLoss) { rawExit = stopLoss; reason = "stop_loss"; }
    else if (candle.low <= takeProfit) { rawExit = takeProfit; reason = "take_profit"; }
  }

  return rawExit == null || reason == null ? trade : closeSimulatedTrade({ trade, time: candle.time, rawExitPrice: rawExit, reason, settings });
}

export function evaluateTradesRange(trades: SimulatedTrade[], candles: Candle[], fromIndex: number, toIndex: number, settings: BacktestSettings) {
  let next = trades;
  for (let index = Math.max(0, fromIndex); index <= Math.min(candles.length - 1, toIndex); index += 1) {
    const candle = candles[index];
    next = next.map((trade) => evaluateTradeOnCandle(trade, candle, settings));
  }
  return next;
}

export function rewindTradesToTime(trades: SimulatedTrade[], time: number): SimulatedTrade[] {
  return trades.filter((trade) => trade.entryTime <= time).map((trade) => {
    if (trade.status === "open" || (trade.exitTime ?? Number.POSITIVE_INFINITY) <= time) return trade;
    const { exitTime: _exitTime, exitPrice: _exitPrice, pnl: _pnl, rMultiple: _rMultiple, closeReason: _closeReason, ...open } = trade;
    return { ...open, status: "open" };
  });
}

export function calculateBacktestStats(initialCapital: number, trades: SimulatedTrade[]): BacktestStats {
  const closed = trades
    .filter((trade) => trade.status === "closed" && typeof trade.pnl === "number")
    .sort((a, b) => (a.exitTime ?? 0) - (b.exitTime ?? 0));
  const pnls = closed.map((trade) => trade.pnl ?? 0);
  const wins = pnls.filter((pnl) => pnl > 0);
  const losses = pnls.filter((pnl) => pnl < 0);
  const grossProfit = wins.reduce((sum, pnl) => sum + pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, pnl) => sum + pnl, 0));
  const netProfit = pnls.reduce((sum, pnl) => sum + pnl, 0);
  const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

  let equity = initialCapital;
  let peak = initialCapital;
  let maxDrawdown = 0;
  const equityCurve = [{ time: 0, equity: round2(initialCapital) }];
  for (const trade of closed) {
    equity += trade.pnl ?? 0;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak - equity);
    equityCurve.push({ time: trade.exitTime ?? 0, equity: round2(equity) });
  }

  return {
    totalTrades: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? null : 0,
    netProfit: round2(netProfit),
    grossProfit: round2(grossProfit),
    grossLoss: round2(grossLoss),
    maxDrawdown: round2(maxDrawdown),
    maxDrawdownPct: initialCapital > 0 ? (maxDrawdown / initialCapital) * 100 : 0,
    averageR: average(closed.map((trade) => trade.rMultiple ?? 0)),
    averageWin: round2(average(wins)),
    averageLoss: round2(average(losses)),
    endingEquity: round2(equity),
    equityCurve,
  };
}

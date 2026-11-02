import type { SeasonalityResult } from "@/lib/seasonality-types";

const p = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
const cls = (v: number) => (v >= 0 ? "text-success" : "text-destructive");

export function computeSeasonStats(data: SeasonalityResult, start: number, end: number) {
  const years = data.yearly ?? [];
  const rets = years
    .map((y) => ({ year: y.year, s: y.closes[start], e: y.closes[end], first: y.closes[0], last: y.closes[364] }))
    .filter((y) => y.s && y.e)
    .map((y) => ({
      year: y.year,
      r: ((y.e - y.s) / y.s) * 100,
      pts: y.e - y.s,
      rest: ((y.last / y.first) / (y.e / y.s) - 1) * 100,
    }));
  if (!rets.length) return null;
  const n = rets.length;
  const days = end - start + 1;
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
  const rs = rets.map((x) => x.r);
  const sorted = [...rs].sort((a, b) => a - b);
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const mean = avg(rs);
  const sd = Math.sqrt(avg(rs.map((r) => (r - mean) ** 2)));
  const gains = rs.filter((r) => r > 0);
  const losses = rs.filter((r) => r <= 0);
  const ann = (m: number, d: number) => (Math.pow(1 + m / 100, 365 / Math.max(1, d)) - 1) * 100;
  const restMean = avg(rets.map((x) => x.rest));
  const downside = Math.sqrt(avg(rs.map((r) => Math.min(0, r) ** 2)));
  let streak = 0;
  const last = rets[rets.length - 1].r > 0;
  for (let i = rets.length - 1; i >= 0 && rets[i].r > 0 === last; i--) streak++;
  const scale = Math.sqrt(365 / days);
  return {
    n,
    days,
    tradingDays: Math.round((days * 5) / 7),
    annualized: ann(mean, days),
    annualizedRest: ann(restMean, 365 - days),
    mean,
    median,
    winRate: (gains.length / n) * 100,
    totalPts: rets.reduce((a, b) => a + b.pts, 0),
    avgPts: avg(rets.map((x) => x.pts)),
    gains: gains.length,
    losses: losses.length,
    avgGain: avg(gains),
    avgLoss: avg(losses),
    maxGain: gains.length ? Math.max(...gains) : 0,
    maxLoss: losses.length ? Math.min(...losses) : 0,
    sd,
    sharpe: sd ? (mean / sd) * scale : 0,
    sortino: downside ? (mean / downside) * scale : 0,
    volatility: sd * scale,
    streak: `${streak} ${last ? "gains" : "losses"}`,
    rets,
  };
}

function Cell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center">
      <div className={`font-mono text-sm font-semibold ${color ?? ""}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Box({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      {title && <h5 className="mb-2 text-center text-xs font-semibold">{title}</h5>}
      <div className="grid grid-cols-2 gap-x-3 gap-y-3">{children}</div>
    </div>
  );
}

export function SeasonalityStats({ data, start, end }: { data: SeasonalityResult; start: number; end: number }) {
  const s = computeSeasonStats(data, start, end);
  if (!s) return <p className="text-xs text-muted-foreground">No yearly data for statistics.</p>;
  const f2 = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return (
    <div className="space-y-3">
      <Box>
        <Cell label="Annualized return" value={p(s.annualized)} color={cls(s.annualized)} />
        <Cell label="Winning trades" value={`${s.winRate.toFixed(2)}%`} />
      </Box>
      <Box title="Return">
        <Cell label="Annualized return" value={p(s.annualized)} color={cls(s.annualized)} />
        <Cell label="Annualized rest" value={p(s.annualizedRest)} color={cls(s.annualizedRest)} />
        <Cell label="Average return" value={p(s.mean)} color={cls(s.mean)} />
        <Cell label="Median return" value={p(s.median)} color={cls(s.median)} />
      </Box>
      <Box title="Profit">
        <Cell label="Total profit (pts)" value={f2(s.totalPts)} color={cls(s.totalPts)} />
        <Cell label="Average profit (pts)" value={f2(s.avgPts)} color={cls(s.avgPts)} />
      </Box>
      <Box title="Gains / Losses">
        <Cell label="Gains" value={String(s.gains)} color="text-success" />
        <Cell label="Losses" value={String(s.losses)} color="text-destructive" />
        <Cell label="Avg profit" value={p(s.avgGain)} color="text-success" />
        <Cell label="Avg loss" value={p(s.avgLoss)} color="text-destructive" />
        <Cell label="Max profit" value={p(s.maxGain)} color="text-success" />
        <Cell label="Max loss" value={p(s.maxLoss)} color="text-destructive" />
      </Box>
      <Box title="Miscellaneous">
        <Cell label="Trades (years)" value={String(s.n)} />
        <Cell label="Current streak" value={s.streak} />
        <Cell label="Trading days" value={String(s.tradingDays)} />
        <Cell label="Calendar days" value={String(s.days)} />
        <Cell label="Std. deviation" value={`${s.sd.toFixed(2)}%`} />
        <Cell label="Sharpe ratio" value={s.sharpe.toFixed(2)} />
        <Cell label="Sortino ratio" value={s.sortino.toFixed(2)} />
        <Cell label="Volatility" value={`${s.volatility.toFixed(2)}%`} />
      </Box>
      <p className="text-[10px] text-muted-foreground">
        Computed from real daily closes, {data.firstYear}–{data.lastYear}. One trade per year over the selected window.
      </p>
    </div>
  );
}

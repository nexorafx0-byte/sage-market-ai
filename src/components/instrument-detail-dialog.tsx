import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CotOverview } from "@/components/cot-overview";
import { ArrowLeft, Activity, Sparkles, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { streamAi } from "@/lib/ai-stream";
import { Button } from "@/components/ui/button";
import { ScoreBar } from "@/components/page-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COT_GROUPS, cotHistory, macroSources } from "@/lib/instrument-detail";
import type { CotGroup } from "@/lib/instrument-detail";
import type { InstrumentDetailReal } from "@/lib/market-types";
import type { FundamentRow } from "@/lib/mock-data";
import { scoreHistory } from "@/lib/score-history";

function ScoreHistoryChart({ pair, score }: { pair: string; score: number }) {
  const [period, setPeriod] = useState(365);
  const points = scoreHistory(pair, score, 365).map((p) => {
    const d = new Date();
    d.setDate(d.getDate() + p.day);
    return {
      ...p,
      score: Math.round(Math.max(-10, Math.min(10, p.score))),
      label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }),
      month: d.toLocaleDateString("en-GB", { month: "short" }),
    };
  }).slice(-period);
  const values = points.map((point) => point.score);
  const high = Math.max(...values);
  const low = Math.min(...values);
  const zero = high <= 0 ? 0 : low >= 0 ? 1 : high / (high - low);
  const monthTicks = points.filter((p, i) => i === 0 || p.month !== points[i - 1].month).map((p) => p.label);

  return (
    <section className="min-w-0 p-4 sm:p-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Score <span className="font-mono text-muted-foreground">{pair}</span>{" "}
          <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
            now {score > 0 ? "+" : ""}
            {Math.round(Math.max(-10, Math.min(10, score)))}
          </span>
        </h3>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
          Sample data
        </span>
      </div>
      <div className="h-[320px] sm:h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="score-hist-stroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset={zero} stopColor="var(--color-success)" />
                <stop offset={zero} stopColor="var(--color-destructive)" />
              </linearGradient>
              <linearGradient id="score-hist-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset={0} stopColor="var(--color-success)" stopOpacity={0.35} />
                <stop offset={zero} stopColor="var(--color-success)" stopOpacity={0.08} />
                <stop offset={zero} stopColor="var(--color-destructive)" stopOpacity={0.08} />
                <stop offset={1} stopColor="var(--color-destructive)" stopOpacity={0.35} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="label"
              ticks={monthTicks}
              tickFormatter={(l: string) => l.split(" ")[1] ?? l}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis domain={[-10, 10]} ticks={[-10, -5, 0, 5, 10]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <ReferenceLine y={0} stroke="var(--color-border)" />
            <Tooltip
              formatter={(v: number) => [`${v > 0 ? "+" : ""}${Math.round(v)}`, "Score"]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              baseValue={0}
              stroke="url(#score-hist-stroke)"
              strokeWidth={1.8}
              fill="url(#score-hist-fill)"
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <span className="mr-2 text-xs text-muted-foreground">Time period</span>
        {[{ label: "1m", days: 30 }, { label: "3m", days: 90 }, { label: "6m", days: 180 }, { label: "1y", days: 365 }].map((item) => (
          <Button key={item.label} size="sm" variant={period === item.days ? "default" : "ghost"} aria-pressed={period === item.days} onClick={() => setPeriod(item.days)}>{item.label}</Button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">Fundamental score · −10 / +10</span>
      </div>
    </section>
  );
}


const nf = (n: number) => n.toLocaleString("sk-SK");

function CotSection({
  row,
  group,
  label,
  desc,
  source,
  real,
}: {
  row: FundamentRow;
  group: CotGroup;
  label: string;
  desc: string;
  source: string;
  real?: InstrumentDetailReal | null;
}) {
  const realWeeks = real?.cot?.[group];
  const weeks = realWeeks && realWeeks.length > 0 ? realWeeks : cotHistory(row, group);
  const latest = weeks[0];
  const longEntry = Math.max(0, latest.longChange);
  const longExit = Math.abs(Math.min(0, latest.longChange));
  const shortEntry = Math.max(0, latest.shortChange);
  const shortExit = Math.abs(Math.min(0, latest.shortChange));


  const pie = [
    { name: "Long vstup", value: longEntry, color: "var(--color-success)" },
    { name: "Short vstup", value: shortEntry, color: "var(--color-success)" },
    { name: "Long exit", value: longExit, color: "var(--color-destructive)" },
    { name: "Short exit", value: shortExit, color: "var(--color-destructive)" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{desc}</p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-right font-mono text-xs">
          <thead>
            <tr className="bg-secondary text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Long zmena</th>
              <th className="px-3 py-2 font-medium">% Long</th>
              <th className="px-3 py-2 font-medium">Long OI</th>
              <th className="px-3 py-2 font-medium">Open Interest</th>
              <th className="px-3 py-2 font-medium">Short OI</th>
              <th className="px-3 py-2 font-medium">% Short</th>
              <th className="px-3 py-2 font-medium">Short zmena</th>
              <th className="px-3 py-2 font-medium">Netto</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => (
              <tr key={w.date} className="border-t border-border">
                <td className="px-3 py-2 text-left">{w.date}</td>
                <td
                  className={`px-3 py-2 ${w.longChange >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
                >
                  {w.longChange >= 0 ? "+" : ""}
                  {nf(w.longChange)}
                </td>
                <td className="bg-success/5 px-3 py-2">{w.longPct.toFixed(2)} %</td>
                <td className="bg-success/5 px-3 py-2">{nf(w.longOi)}</td>
                <td className="px-3 py-2">{nf(w.openInterest)}</td>
                <td className="bg-destructive/5 px-3 py-2">{nf(w.shortOi)}</td>
                <td className="bg-destructive/5 px-3 py-2">{w.shortPct.toFixed(2)} %</td>
                <td
                  className={`px-3 py-2 ${w.shortChange >= 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}
                >
                  {w.shortChange >= 0 ? "+" : ""}
                  {nf(w.shortChange)}
                </td>
                <td className={`px-3 py-2 ${w.net >= 0 ? "text-success" : "text-destructive"}`}>
                  {nf(w.net)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground">Source: {source} · weekly data.</p>

      <div className="rounded-lg border border-border p-4">
        <h4 className="mb-2 text-sm font-semibold">
          {label} — weekly position changes ({latest.date})
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pie}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)} %`}
              >
                {pie.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => nf(v)}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                  fontSize: 12,
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function InstrumentFactors({ factors }: { factors: NonNullable<FundamentRow["factors"]> }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-3" aria-label="Fundamental factors">
      {factors.map((factor) => {
        const unavailable = /^n\/a/i.test(factor.value);
         const score = unavailable ? null : Math.round(Math.max(-10, Math.min(10, factor.score)));
        return (
          <div key={factor.key} className="min-w-0 border-b border-border/50 pb-2">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 break-words text-[11px] leading-4 text-muted-foreground">{factor.label}</span>
              <span aria-label={score == null ? "No data" : `Score ${score}`} className={`flex h-5 min-w-6 shrink-0 items-center justify-center rounded-sm bg-secondary px-1 font-mono text-[10px] ${score == null || score === 0 ? "text-muted-foreground" : score > 0 ? "text-success" : "text-destructive"}`}>{score == null ? "—" : score}</span>
            </div>
            <p className="mt-1 break-words font-mono text-[10px] leading-4">{factor.value}</p>
            <p className="break-words text-[9px] leading-3 text-muted-foreground">{factor.source}</p>
          </div>
        );
      })}
    </div>
  );
}

function InstrumentAiSummary({ row, isReal }: { row: FundamentRow; isReal: boolean }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const generate = async () => {
    if (busy) return;
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setError("");
    setText("");
    try {
      await streamAi({ mode: "chat", messages: [{ role: "user", content: `Write an English fundamental summary for ${row.pair} in 180 words or fewer, plain text with short paragraphs and bullet points (no markdown headings). Explain the meaning of the score, the strongest supportive and opposing factors, and risks that could reverse the outlook. Explain economic mechanisms using general macro knowledge, without claiming certainty. The displayed snapshot is ${isReal ? "published-source data" : "SAMPLE DATA, not a live market assessment"}: ${JSON.stringify(row)}. Base numerical claims only on this snapshot; distinguish general knowledge from observations. Do not invent current price, news, probabilities, missing factors or historical scores. If sample data, clearly call it an illustrative explanation. Scores are −10 to +10 ratings, not percentages. Include a short not-financial-advice disclaimer.` }] }, setText, abort.signal);
    } catch (e) {
      if (!abort.signal.aborted) setError(e instanceof Error ? e.message : "AI summary is unavailable.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="min-w-0 border-t border-border p-4 sm:p-5 lg:border-t-0 lg:border-l" aria-label="AI summary">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" />AI summary <span className="font-mono text-muted-foreground">{row.pair}</span></h3>
        {busy ? <Button variant="ghost" size="sm" onClick={() => controller.current?.abort()}><Square />Stop</Button> : <Button variant="outline" size="sm" onClick={generate}><Sparkles />{text ? "Refresh summary" : "Generate summary"}</Button>}
      </div>
      {text ? <div className="whitespace-pre-wrap text-xs leading-6">{text}</div> : (
        <div className="space-y-3 text-xs leading-6 text-muted-foreground">
          <p>{row.pair} has a fundamental rating of {Math.round(row.score)} out of 10. {row.score > 0 ? "Positive readings indicate that the scored factors lean toward support for the instrument." : row.score < 0 ? "Negative readings indicate that the scored factors lean toward downward pressure on the instrument." : "The scored factors are balanced, with no clear directional edge."}</p>
          <p>Interest-rate expectations influence capital flows; growth and inflation shape central-bank policy. COT describes futures positioning, not a guaranteed price direction. Conflicting factors can weaken the overall signal.</p>
          <p>This score is not a probability or a trade recommendation. {isReal ? "" : "Displayed values are sample data, so this is only an illustrative interpretation."}</p>
        </div>
      )}
      {busy && <p className="mt-3 animate-pulse text-xs text-primary" role="status">AI is analyzing the displayed factors…</p>}
      {error && <p className="mt-3 text-xs text-destructive" role="alert">{error}</p>}
      <p className="mt-4 text-[10px] text-muted-foreground">{text ? "AI-generated explanation · verify against original sources." : "General score interpretation · AI generation uses credits."}</p>
    </section>
  );
}

export function InstrumentDetailDialog({
  row,
  detail,
  onOpenChange,
}: {
  row: FundamentRow | null;
  detail?: InstrumentDetailReal | null;
  onOpenChange: (open: boolean) => void;
}) {
  if (!row) return null;
  const sources = detail?.macro?.length ? detail.macro : macroSources(row);
  const isReal = !!detail?.macro?.length;

  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent className="inset-0 flex h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:rounded-none">
        <DialogHeader className="shrink-0 border-b border-border bg-background px-4 py-4 pr-14 sm:px-6 sm:pr-16">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}><ArrowLeft />Back</Button>
            <Activity className="hidden h-6 w-6 text-primary sm:block" />
          <DialogTitle className="font-mono text-xl sm:text-2xl">
            {row.pair} · {row.bias} ({row.score > 0 ? "+" : ""}
             {Math.round(Math.max(-10, Math.min(10, row.score)))})
          </DialogTitle>
          <span className="ml-auto hidden text-xs font-semibold tracking-wider text-primary sm:block">MARKETMIND</span>
          </div>
          <DialogDescription className="sr-only">
            {isReal
              ? "Real data: BIS (rates), World Bank (inflation, GDP) and CFTC COT (Non-Commercial, Commercial, Retail)."
              : "Breakdown of macroeconomic data and COT positioning (Non-Commercial, Commercial, Retail)."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overall" className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-border px-4 py-2 sm:px-6">
            <TabsList>
              <TabsTrigger value="overall">Overall</TabsTrigger>
              <TabsTrigger value="cot">COT</TabsTrigger>
              <TabsTrigger value="history">COT history</TabsTrigger>
            </TabsList>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <TabsContent value="overall" className="m-0">
            <div className="grid border-b border-border lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
              <ScoreHistoryChart pair={row.pair} score={row.score} />
              <section className="border-t border-border p-4 sm:p-6 lg:border-t-0 lg:border-l">
                <h3 className="mb-6 text-sm font-semibold">Fundamental summary <span className="font-mono text-muted-foreground">{row.pair}</span></h3>
                <p className={`font-mono text-4xl ${row.score >= 0 ? "text-success" : "text-destructive"}`}>{row.score > 0 ? "+" : ""}{Math.round(row.score)}<span className="text-base text-muted-foreground"> / 10</span></p>
                <p className="mt-2 text-sm font-medium">{row.bias}</p>
                <div className="my-5"><ScoreBar value={row.score} max={10} /></div>
                <div className="space-y-3">
                  {(row.factors?.length ? row.factors.filter((f) => !/^n\/a/i.test(f.value)).slice().sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 4) : sources).slice(0, 4).map((f) => (
                    <div key={f.label} className="flex items-start justify-between gap-4 border-b border-border pb-3 text-xs">
                      <span className="text-muted-foreground">{f.label}</span><span className="text-right font-mono">{f.value}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-[11px] leading-5 text-muted-foreground">{isReal ? "Current factors from published market sources." : "Sample macro values — live data unavailable."} Historical score curve is illustrative, not recorded daily fundamentals.</p>
              </section>
            </div>
            <div className="grid border-b border-border lg:grid-cols-[minmax(320px,440px)_minmax(0,1fr)]">
            <section className="min-w-0 p-4 sm:p-5">
            <h3 className="mb-4 text-sm font-semibold">Score overview <span className="font-mono text-muted-foreground">{row.pair}</span></h3>

          <InstrumentFactors factors={row.factors?.length ? row.factors : sources.map((source) => ({ ...source, key: source.label }))} />
            </section>
            <InstrumentAiSummary key={row.pair} row={row} isReal={isReal} />
            </div>

          </TabsContent>
          <TabsContent value="cot" className="m-0 p-4 sm:p-6">
            <CotOverview row={row} detail={detail} />
          </TabsContent>

        {/* COT by group */}
        <TabsContent value="history" className="m-0 p-4 sm:p-6">
          <h3 className="mb-3 text-sm font-semibold">COT history — by group</h3>
          <Tabs defaultValue="noncommercial">
            <TabsList>
              {COT_GROUPS.map((g) => (
                <TabsTrigger key={g.key} value={g.key}>
                  {g.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {COT_GROUPS.map((g) => (
              <TabsContent key={g.key} value={g.key} className="mt-4">
                <CotSection
                  row={row}
                  group={g.key}
                  label={g.label}
                  desc={g.desc}
                  source={detail?.cotSource ?? g.source}
                  real={detail}
                />
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { CandlestickChart, LineChart as LineIcon, BarChart3 } from "lucide-react";

import { PageHeader, Panel } from "@/components/page-shell";
import type { ChartSettings, ChartType } from "@/components/trading-chart";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  PAIRS,
  TIMEFRAMES,
  detectZones,
  ema,
  generateCandles,
  macd,
  pctChange,
  rsi,
  type TimeframeKey,
} from "@/lib/market-data";

const TradingChart = lazy(() => import("@/components/trading-chart"));

export const Route = createFileRoute("/grafy")({
  head: () => ({
    meta: [
      { title: "Grafy a technická analýza — Trading Analyzer AI" },
      {
        name: "description",
        content:
          "Interaktívne sviečkové grafy s EMA, RSI, MACD, objemom a supply & demand zónami pre forex, zlato a krypto.",
      },
      { property: "og:title", content: "Grafy a technická analýza — Trading Analyzer AI" },
      {
        property: "og:description",
        content: "Sviečkové grafy s indikátormi a AI čítaním trhu na jednom mieste.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChartsPage,
});

const chartTypes: { key: ChartType; label: string; icon: typeof CandlestickChart }[] = [
  { key: "candles", label: "Sviečky", icon: CandlestickChart },
  { key: "bars", label: "Bary", icon: BarChart3 },
  { key: "area", label: "Plocha", icon: LineIcon },
];

function ChartsPage() {
  const [symbol, setSymbol] = useState<string>("EURUSD");
  const [tf, setTf] = useState<TimeframeKey>("H1");
  const [settings, setSettings] = useState<ChartSettings>({
    type: "candles",
    ema20: true,
    ema50: true,
    ema200: false,
    volume: true,
    rsi: true,
    macd: false,
    zones: true,
  });

  const candles = useMemo(() => generateCandles(symbol, tf), [symbol, tf]);
  const meta = PAIRS.find((p) => p.symbol === symbol)!;
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const change = ((last.close - prev.close) / prev.close) * 100;
  const closes = candles.map((c) => c.close);

  const rsiNow = rsi(closes).at(-1) ?? 50;
  const ema50Now = ema(closes, 50).at(-1) ?? last.close;
  const ema200Now = ema(closes, 200).at(-1) ?? last.close;
  const macdNow = macd(closes).hist.at(-1) ?? 0;
  const zones = detectZones(candles);
  const period = pctChange(candles);

  const toggle = (key: keyof ChartSettings) =>
    setSettings((s) => ({ ...s, [key]: !s[key as keyof ChartSettings] }));

  const fmt = (v: number) => v.toFixed(meta.digits);

  return (
    <>
      <PageHeader
        title="Grafy & technická analýza"
        subtitle="Sviečkové grafy, indikátory a AI čítanie trhu"
        actions={
          <div className="flex items-center gap-2">
            {chartTypes.map((t) => (
              <Button
                key={t.key}
                size="sm"
                variant={settings.type === t.key ? "default" : "outline"}
                className="gap-1.5"
                onClick={() => setSettings((s) => ({ ...s, type: t.key }))}
              >
                <t.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </Button>
            ))}
          </div>
        }
      />

      <div className="space-y-5 p-6">
        <div className="flex flex-wrap items-center gap-2">
          {PAIRS.map((p) => (
            <Button
              key={p.symbol}
              size="sm"
              variant={p.symbol === symbol ? "secondary" : "ghost"}
              className="font-mono"
              onClick={() => setSymbol(p.symbol)}
            >
              {p.symbol}
            </Button>
          ))}
          <span className="mx-1 h-5 w-px bg-border" />
          {TIMEFRAMES.map((t) => (
            <Button
              key={t.key}
              size="sm"
              variant={t.key === tf ? "secondary" : "ghost"}
              onClick={() => setTf(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </div>

        <Panel
          title={`${symbol} · ${TIMEFRAMES.find((t) => t.key === tf)?.label}`}
          hint={`O ${fmt(last.open)} · H ${fmt(last.high)} · L ${fmt(last.low)} · C ${fmt(last.close)}`}
          action={
            <span
              className={
                change >= 0
                  ? "font-mono text-sm font-semibold text-success"
                  : "font-mono text-sm font-semibold text-destructive"
              }
            >
              {change >= 0 ? "+" : ""}
              {change.toFixed(2)} %
            </span>
          }
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {(
              [
                ["ema20", "EMA 20"],
                ["ema50", "EMA 50"],
                ["ema200", "EMA 200"],
                ["volume", "Objem"],
                ["rsi", "RSI"],
                ["macd", "MACD"],
                ["zones", "S&D zóny"],
              ] as const
            ).map(([key, label]) => (
              <Toggle
                key={key}
                size="sm"
                variant="outline"
                pressed={settings[key] as boolean}
                onPressedChange={() => toggle(key)}
                className="h-8 text-xs"
              >
                {label}
              </Toggle>
            ))}
          </div>

          <ClientOnly
            fallback={
              <div className="h-[520px] w-full animate-pulse rounded-lg bg-secondary" />
            }
          >
            <Suspense
              fallback={<div className="h-[520px] w-full animate-pulse rounded-lg bg-secondary" />}
            >
              <TradingChart candles={candles} settings={settings} />
            </Suspense>
          </ClientOnly>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-3">
          <Panel title="Indikátory" hint="Aktuálne hodnoty">
            <dl className="space-y-3 text-sm">
              <Row label="RSI (14)" value={rsiNow.toFixed(1)} tone={rsiNow > 70 ? "neg" : rsiNow < 30 ? "pos" : "neutral"} />
              <Row label="EMA 50" value={fmt(ema50Now)} tone={last.close > ema50Now ? "pos" : "neg"} />
              <Row label="EMA 200" value={fmt(ema200Now)} tone={last.close > ema200Now ? "pos" : "neg"} />
              <Row label="MACD histogram" value={macdNow.toFixed(meta.digits)} tone={macdNow >= 0 ? "pos" : "neg"} />
              <Row
                label="Zmena za obdobie"
                value={`${period >= 0 ? "+" : ""}${period.toFixed(2)} %`}
                tone={period >= 0 ? "pos" : "neg"}
              />
            </dl>
          </Panel>

          <Panel title="Detegované zóny" hint="Swing supply & demand">
            <div className="space-y-2.5">
              {zones.map((z) => (
                <div
                  key={`${z.type}-${z.time}`}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span
                    className={
                      z.type === "supply"
                        ? "rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
                        : "rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
                    }
                  >
                    {z.type === "supply" ? "Supply" : "Demand"}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {fmt(z.from)} – {fmt(z.to)}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="AI čítanie grafu" hint="Automatické zhrnutie">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {symbol} sa obchoduje {last.close > ema200Now ? "nad" : "pod"} EMA 200, čo definuje{" "}
              <strong className="text-foreground">
                {last.close > ema200Now ? "býčiu" : "medvediu"}
              </strong>{" "}
              štruktúru na {TIMEFRAMES.find((t) => t.key === tf)?.label}. RSI {rsiNow.toFixed(0)}{" "}
              {rsiNow > 70
                ? "signalizuje prekúpenosť — čakaj korekciu do najbližšej demand zóny."
                : rsiNow < 30
                  ? "signalizuje prepredanosť — sleduj reakciu v demand zóne."
                  : "je v neutrálnom pásme, trh má priestor pokračovať v trende."}{" "}
              MACD histogram je {macdNow >= 0 ? "kladný" : "záporný"}, momentum teda podporuje{" "}
              {macdNow >= 0 ? "kupujúcich" : "predávajúcich"}.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Najbližšia reakčná úroveň: {zones.length > 0 ? `${fmt(zones[zones.length - 1].from)} – ${fmt(zones[zones.length - 1].to)}` : "—"}. Vstup potvrď až po
              uzavretí sviečky nad/pod zónou.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: "pos" | "neg" | "neutral" }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={
          tone === "pos"
            ? "font-mono font-medium text-success"
            : tone === "neg"
              ? "font-mono font-medium text-destructive"
              : "font-mono font-medium text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}

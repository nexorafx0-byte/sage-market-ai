import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";

import { PageHeader, Panel } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CHART_GROUPS,
  CHART_INSTRUMENTS,
  CHART_INTERVALS,
  type ChartInterval,
} from "@/lib/tradingview-symbols";

const TradingViewChart = lazy(() => import("@/components/tradingview-chart"));

export const Route = createFileRoute("/grafy")({
  head: () => ({
    meta: [
      { title: "Grafy a technická analýza — Trading Analyzer AI" },
      {
        name: "description",
        content:
          "Živé TradingView grafy pre všetky forex páry, komodity, indexy aj krypto s indikátormi a kresliacimi nástrojmi.",
      },
      { property: "og:title", content: "Grafy a technická analýza — Trading Analyzer AI" },
      {
        property: "og:description",
        content: "TradingView grafy pre všetky inštrumenty z AI analýzy trhu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChartsPage,
});

function ChartsPage() {
  const [id, setId] = useState("EURUSD");
  const [interval, setInterval] = useState<ChartInterval>("60");
  const [q, setQ] = useState("");

  const active = CHART_INSTRUMENTS.find((i) => i.id === id) ?? CHART_INSTRUMENTS[0];

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return CHART_GROUPS.map((g) => ({
      title: g,
      items: CHART_INSTRUMENTS.filter(
        (i) => i.group === g && (!needle || i.label.toLowerCase().includes(needle) || i.id.toLowerCase().includes(needle)),
      ),
    })).filter((g) => g.items.length > 0);
  }, [q]);

  return (
    <>
      <PageHeader
        title="Grafy & technická analýza"
        subtitle="Živé TradingView grafy pre všetky inštrumenty z AI analýzy"
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            {CHART_INTERVALS.map((t) => (
              <Button
                key={t.key}
                size="sm"
                variant={interval === t.key ? "default" : "outline"}
                onClick={() => setInterval(t.key)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid gap-5 p-6 lg:grid-cols-[260px_1fr]">
        <Panel title="Inštrumenty" hint={`${CHART_INSTRUMENTS.length} symbolov`}>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hľadať symbol…"
            className="mb-3"
          />
          <div className="max-h-[560px] space-y-4 overflow-y-auto pr-1">
            {groups.map((g) => (
              <div key={g.title}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {g.title}
                </p>
                <div className="space-y-0.5">
                  {g.items.map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => setId(i.id)}
                      className={
                        i.id === id
                          ? "w-full rounded-md bg-primary/15 px-2 py-1.5 text-left font-mono text-sm text-primary"
                          : "w-full rounded-md px-2 py-1.5 text-left font-mono text-sm text-muted-foreground hover:bg-muted"
                      }
                    >
                      {i.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title={active.label}
          hint={`TradingView · ${active.tv} · ${CHART_INTERVALS.find((t) => t.key === interval)?.label}`}
        >
          <ClientOnly
            fallback={
              <div className="flex h-[620px] items-center justify-center text-sm text-muted-foreground">
                Načítavam graf…
              </div>
            }
          >
            <Suspense
              fallback={
                <div className="flex h-[620px] items-center justify-center text-sm text-muted-foreground">
                  Načítavam graf…
                </div>
              }
            >
              <TradingViewChart key={`${active.tv}-${interval}`} symbol={active.tv} interval={interval} />
            </Suspense>
          </ClientOnly>
        </Panel>
      </div>
    </>
  );
}

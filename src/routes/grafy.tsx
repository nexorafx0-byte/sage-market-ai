import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";

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
          "Živé TradingView grafy na celú obrazovku pre všetky forex páry, komodity, indexy aj krypto s indikátormi a kresliacimi nástrojmi.",
      },
      { property: "og:title", content: "Grafy a technická analýza — Trading Analyzer AI" },
      {
        property: "og:description",
        content: "TradingView grafy na celú obrazovku pre všetky inštrumenty z AI analýzy trhu.",
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
  const [open, setOpen] = useState(false);

  const active = CHART_INSTRUMENTS.find((i) => i.id === id) ?? CHART_INSTRUMENTS[0];

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return CHART_GROUPS.map((g) => ({
      title: g,
      items: CHART_INSTRUMENTS.filter(
        (i) =>
          i.group === g &&
          (!needle ||
            i.label.toLowerCase().includes(needle) ||
            i.id.toLowerCase().includes(needle)),
      ),
    })).filter((g) => g.items.length > 0);
  }, [q]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background">
      <ClientOnly
        fallback={
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Načítavam graf…
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Načítavam graf…
            </div>
          }
        >
          <TradingViewChart
            key={`${active.tv}-${interval}`}
            symbol={active.tv}
            interval={interval}
          />
        </Suspense>
      </ClientOnly>

      {/* Ovládanie v rohu */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-col gap-2">
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card/95 p-1.5 shadow-[var(--shadow-card)] backdrop-blur">
          <Button
            size="sm"
            variant={open ? "default" : "secondary"}
            onClick={() => setOpen((v) => !v)}
            className="gap-1.5"
          >
            {open ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            <span className="font-mono">{active.label}</span>
          </Button>
          <div className="mx-1 h-5 w-px bg-border" />
          {CHART_INTERVALS.map((t) => (
            <Button
              key={t.key}
              size="sm"
              variant={interval === t.key ? "default" : "ghost"}
              onClick={() => setInterval(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </div>

        {open && (
          <div className="pointer-events-auto w-[280px] rounded-xl border border-border bg-card/95 p-3 shadow-[var(--shadow-card)] backdrop-blur">
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Hľadať symbol…"
              className="mb-3"
            />
            <div className="max-h-[60dvh] space-y-4 overflow-y-auto pr-1">
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
                        onClick={() => {
                          setId(i.id);
                          setOpen(false);
                        }}
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
              {groups.length === 0 && (
                <p className="text-sm text-muted-foreground">Žiadny výsledok.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

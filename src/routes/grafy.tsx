import { useQuery } from "@tanstack/react-query";
import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Search, Star, Trash2, X } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAlerts, useFavorites } from "@/lib/chart-prefs";
import { getQuotes } from "@/lib/quotes.functions";
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
      { title: "Charts, alerts and technical analysis — MARKETMIND" },
      {
        name: "description",
        content:
          "Live full-screen TradingView charts with price alerts and favorite instruments — forex, commodities, indices and crypto.",
      },
      { property: "og:title", content: "Charts, alerts and technical analysis — MARKETMIND" },
      {
        property: "og:description",
        content: "Full-screen TradingView charts, price alerts and favorite pairs.",
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
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertPrice, setAlertPrice] = useState("");
  const [alertDir, setAlertDir] = useState<"above" | "below">("above");

  const { favorites, toggle } = useFavorites();
  const { alerts, add, remove, markTriggered } = useAlerts();

  const active = CHART_INSTRUMENTS.find((i) => i.id === id) ?? CHART_INSTRUMENTS[0];

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const match = (i: (typeof CHART_INSTRUMENTS)[number]) =>
      !needle || i.label.toLowerCase().includes(needle) || i.id.toLowerCase().includes(needle);

    const favItems = CHART_INSTRUMENTS.filter((i) => favorites.includes(i.id) && match(i));
    const rest = CHART_GROUPS.map((g) => ({
      title: g as string,
      items: CHART_INSTRUMENTS.filter((i) => i.group === g && match(i)),
    })).filter((g) => g.items.length > 0);

    return favItems.length ? [{ title: "⭐ Favorites", items: favItems }, ...rest] : rest;
  }, [q, favorites]);

  // Price tracking for active alerts
  const fetchQuotes = useServerFn(getQuotes);
  const pending = alerts.filter((a) => !a.triggeredAt);
  const watched = [...new Set(pending.map((a) => a.yahoo))].slice(0, 20);

  const { data: quotes } = useQuery({
    queryKey: ["quotes", watched],
    queryFn: () => fetchQuotes({ data: { symbols: watched } }),
    enabled: watched.length > 0,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!quotes?.length) return;
    const priceOf = new Map(quotes.map((q2) => [q2.symbol, q2.price]));
    const hit = pending.filter((a) => {
      const p = priceOf.get(a.yahoo);
      if (p == null) return false;
      return a.direction === "above" ? p >= a.price : p <= a.price;
    });
    if (!hit.length) return;
    hit.forEach((a) =>
      toast.warning(`Alert: ${a.label}`, {
        description: `Price ${a.direction === "above" ? "rose above" : "fell below"} ${a.price} (now ${priceOf.get(a.yahoo)?.toFixed(5)})`,
      }),
    );
    markTriggered(hit.map((a) => a.id));
  }, [quotes]);

  const submitAlert = () => {
    const price = Number(alertPrice.replace(",", "."));
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    add({
      instrumentId: active.id,
      label: active.label,
      yahoo: active.yahoo,
      direction: alertDir,
      price,
    });
    setAlertPrice("");
    toast.success(`Alert set: ${active.label} ${alertDir === "above" ? "≥" : "≤"} ${price}`);
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background">
      <ClientOnly
        fallback={
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading chart…
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading chart…
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

      {/* Controls in the left corner */}
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
          <Button
            size="icon"
            variant="ghost"
            aria-label="Add to favorites"
            onClick={() => toggle(active.id)}
          >
            <Star
              className={
                favorites.includes(active.id)
                  ? "h-4 w-4 fill-primary text-primary"
                  : "h-4 w-4 text-muted-foreground"
              }
            />
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

        {/* Quick favorites */}
        {favorites.length > 0 && (
          <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card/95 p-1.5 shadow-[var(--shadow-card)] backdrop-blur">
            {CHART_INSTRUMENTS.filter((i) => favorites.includes(i.id)).map((i) => (
              <Button
                key={i.id}
                size="sm"
                variant={i.id === id ? "default" : "ghost"}
                className="font-mono"
                onClick={() => setId(i.id)}
              >
                {i.label}
              </Button>
            ))}
          </div>
        )}

        {open && (
          <div className="pointer-events-auto w-[300px] rounded-xl border border-border bg-card/95 p-3 shadow-[var(--shadow-card)] backdrop-blur">
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search symbol…"
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
                      <div key={`${g.title}-${i.id}`} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setId(i.id);
                            setOpen(false);
                          }}
                          className={
                            i.id === id
                              ? "flex-1 rounded-md bg-primary/15 px-2 py-1.5 text-left font-mono text-sm text-primary"
                              : "flex-1 rounded-md px-2 py-1.5 text-left font-mono text-sm text-muted-foreground hover:bg-muted"
                          }
                        >
                          {i.label}
                        </button>
                        <button
                          type="button"
                          aria-label={`Favorite ${i.label}`}
                          onClick={() => toggle(i.id)}
                          className="rounded-md p-1.5 hover:bg-muted"
                        >
                          <Star
                            className={
                              favorites.includes(i.id)
                                ? "h-3.5 w-3.5 fill-primary text-primary"
                                : "h-3.5 w-3.5 text-muted-foreground"
                            }
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {groups.length === 0 && (
                <p className="text-sm text-muted-foreground">No results.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Alerty v pravom rohu */}
      <div className="pointer-events-none absolute right-3 top-3 z-20 flex flex-col items-end gap-2">
        <Button
          size="sm"
          variant={alertsOpen ? "default" : "secondary"}
          onClick={() => setAlertsOpen((v) => !v)}
          className="pointer-events-auto gap-1.5 shadow-[var(--shadow-card)]"
        >
          <Bell className="h-4 w-4" />
          Alerty {pending.length > 0 && `(${pending.length})`}
        </Button>

        {alertsOpen && (
          <div className="pointer-events-auto w-[300px] rounded-xl border border-border bg-card/95 p-3 shadow-[var(--shadow-card)] backdrop-blur">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              New alert · {active.label}
            </p>
            <div className="mb-2 flex gap-1">
              <Button
                size="sm"
                className="flex-1"
                variant={alertDir === "above" ? "default" : "outline"}
                onClick={() => setAlertDir("above")}
              >
                Nad ↑
              </Button>
              <Button
                size="sm"
                className="flex-1"
                variant={alertDir === "below" ? "default" : "outline"}
                onClick={() => setAlertDir("below")}
              >
                Pod ↓
              </Button>
            </div>
            <div className="flex gap-1.5">
              <Input
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitAlert()}
                placeholder="Cena…"
                inputMode="decimal"
              />
              <Button size="sm" onClick={submitAlert}>
                Add
              </Button>
            </div>

            <div className="mt-3 max-h-[45dvh] space-y-1 overflow-y-auto">
              {alerts.length === 0 && (
                <p className="text-xs text-muted-foreground">No alerts yet.</p>
              )}
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm text-foreground">
                      {a.label} {a.direction === "above" ? "≥" : "≤"} {a.price}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {a.triggeredAt
                        ? `Triggered ${new Date(a.triggeredAt).toLocaleString("en-US")}`
                        : "Waiting for price · checked every minute"}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Delete alert"
                    onClick={() => remove(a.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

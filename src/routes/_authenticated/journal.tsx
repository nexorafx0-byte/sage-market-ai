import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, Panel, Stat } from "@/components/page-shell";
import { TradeDialog } from "@/components/trade-dialog";
import { Button } from "@/components/ui/button";
import {
  deleteTrade,
  listTrades,
  saveTrade,
  type JournalTrade,
  type JournalTradeInput,
} from "@/lib/journal.functions";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({
    meta: [
      { title: "Trading Journal — MARKETMIND" },
      {
        name: "description",
        content:
          "Log every trade: entry, SL, TP, risk, R:R, fundamentals, seasonality, psychology and screenshots.",
      },
      { property: "og:title", content: "Trading Journal — MARKETMIND" },
      {
        property: "og:description",
        content: "A complete trading journal with risk, fundamentals and psychology tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JournalPage,
});

const fmtMoney = (v: number) =>
  `${v > 0 ? "+" : ""}${v.toLocaleString("en-US", { maximumFractionDigits: 2 })} €`;

function JournalPage() {
  const queryClient = useQueryClient();
  const fetchTrades = useServerFn(listTrades);
  const persistTrade = useServerFn(saveTrade);
  const removeTrade = useServerFn(deleteTrade);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<JournalTrade | null>(null);

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["journal-trades"],
    queryFn: () => fetchTrades(),
  });

  const saveMutation = useMutation({
    mutationFn: (input: JournalTradeInput) => persistTrade({ data: input }),
    onSuccess: () => {
      toast.success("Trade saved");
      setOpen(false);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["journal-trades"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeTrade({ data: { id } }),
    onSuccess: () => {
      toast.success("Trade deleted");
      queryClient.invalidateQueries({ queryKey: ["journal-trades"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const withPnl = trades.filter((t) => typeof t.pnl === "number");
  const totalPnl = withPnl.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const wins = withPnl.filter((t) => (t.pnl ?? 0) > 0).length;
  const winRate = withPnl.length ? Math.round((wins / withPnl.length) * 100) : 0;
  const withRr = trades.filter((t) => typeof t.rr === "number");
  const avgRr = withRr.length
    ? withRr.reduce((s, t) => s + (t.rr ?? 0), 0) / withRr.length
    : 0;
  const discipline = trades.length
    ? Math.round((trades.filter((t) => t.rules_followed).length / trades.length) * 100)
    : 0;

  return (
    <>
      <PageHeader
        title="Trading Journal"
        subtitle="Log every trade with full context — setup, risk, fundamentals and psychology"
        actions={
          <Button
            className="gap-2"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New trade
          </Button>
        }
      />

      <div className="space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Net P&L"
            value={fmtMoney(totalPnl)}
            delta={`${withPnl.length} closed trades`}
            tone={totalPnl >= 0 ? "positive" : "negative"}
          />
          <Stat label="Win rate" value={`${winRate}%`} delta={`${wins} winners`} />
          <Stat
            label="Average R:R"
            value={avgRr ? avgRr.toFixed(2) : "—"}
            delta={`${withRr.length} trades with R:R`}
          />
          <Stat
            label="Discipline"
            value={`${discipline}%`}
            delta="rules followed"
            tone={discipline >= 80 ? "positive" : "negative"}
          />
        </div>

        <Panel title="Trade history" hint={`${trades.length} entries`}>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading trades…</p>
          ) : trades.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">No trades logged yet.</p>
              <Button
                className="mt-4 gap-2"
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Log your first trade
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {trades.map((t) => (
                <article key={t.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">
                      {new Date(t.traded_at).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                    <span className="font-mono font-semibold">{t.instrument}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        t.direction === "long"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {t.direction.toUpperCase()}
                    </span>
                    {t.timeframe && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                        {t.timeframe}
                      </span>
                    )}
                    {typeof t.rr === "number" && (
                      <span className="font-mono text-xs text-muted-foreground">
                        R:R {t.rr.toFixed(2)}
                      </span>
                    )}
                    {typeof t.pnl === "number" && (
                      <span
                        className={
                          t.pnl >= 0
                            ? "font-mono font-semibold text-success"
                            : "font-mono font-semibold text-destructive"
                        }
                      >
                        {fmtMoney(t.pnl)}
                      </span>
                    )}
                    <span
                      className={`ml-auto text-xs font-medium ${
                        t.rules_followed ? "text-success" : "text-destructive"
                      }`}
                    >
                      {t.rules_followed ? "✅ Rules followed" : "⚠️ Rules broken"}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditing(t);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(t.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                    <Detail label="Entry" value={t.entry_price} />
                    <Detail label="SL" value={t.stop_loss} />
                    <Detail label="TP" value={t.take_profit} />
                    <Detail
                      label="Lot / risk"
                      value={
                        [t.lot_size, t.risk_pct !== null ? `${t.risk_pct}%` : null]
                          .filter((v) => v !== null && v !== undefined)
                          .join(" · ") || null
                      }
                    />
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Note label="🎯 Zone" value={t.sd_zone} />
                    <Note label="📰 Fundamentals" value={t.fundamental} />
                    <Note label="📊 Seasonality" value={t.seasonality} />
                    <Note label="🧠 Entry reason" value={t.entry_reason} />
                    <Note label="😎 Psychology" value={t.psychology} />
                    {!t.rules_followed && <Note label="⚠️ Broken rules" value={t.rules_broken} />}
                  </div>

                  {t.screenshot_url && (
                    <a
                      href={t.screenshot_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
                    >
                      📸 Open setup screenshot
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <TradeDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditing(null);
        }}
        trade={editing}
        onSave={(input) => saveMutation.mutate(input)}
        saving={saveMutation.isPending}
      />
    </>
  );
}

function Detail({ label, value }: { label: string; value: number | string | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="rounded-md bg-secondary/40 px-2.5 py-1.5">
      <span className="text-[10px] uppercase tracking-wide">{label}</span>
      <div className="font-mono text-xs text-foreground">{value}</div>
    </div>
  );
}

function Note({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-lg bg-accent p-3 text-xs leading-relaxed text-accent-foreground">
      <span className="font-semibold">{label}: </span>
      {value}
    </div>
  );
}

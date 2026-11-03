import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeader, Panel, Stat } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal — MARKETMIND" },
      { name: "description", content: "Trading journal: log pair, entry, risk, result and chart links before and after each trade." },
      { property: "og:title", content: "Journal — MARKETMIND" },
      { property: "og:description", content: "Log every trade with before/after chart links." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JournalPage,
});

type Trade = {
  id: string;
  date: string;
  pair: string;
  entry: string;
  result: "Win" | "Loss";
  risk: string;
  before: string;
  after: string;
};

const KEY = "mm-journal-trades";
const empty = { pair: "", entry: "", result: "Win" as const, risk: "", before: "", after: "" };

function JournalPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Trade, "id" | "date">>(empty);

  useEffect(() => {
    try {
      setTrades(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch {
      /* ignore */
    }
  }, []);

  const save = (next: Trade[]) => {
    setTrades(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pair.trim()) return;
    save([{ ...form, pair: form.pair.toUpperCase(), id: crypto.randomUUID(), date: new Date().toISOString() }, ...trades]);
    setForm(empty);
    setOpen(false);
  };

  const wins = trades.filter((t) => t.result === "Win").length;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHeader title="Journal" subtitle="Log every trade with chart links before and after" />
      <div className="space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Trades" value={String(trades.length)} delta="total logged" />
          <Stat label="Win rate" value={trades.length ? `${Math.round((wins / trades.length) * 100)} %` : "—"} delta={`${wins} W / ${trades.length - wins} L`} tone="positive" />
          <Stat label="Losses" value={String(trades.length - wins)} delta="total" tone="negative" />
        </div>

        <div className="flex justify-end">
          <Button className="gap-2" onClick={() => setOpen((o) => !o)}>
            <Plus className="h-4 w-4" /> Add trade
          </Button>
        </div>

        {open && (
          <Panel title="Add trade">
            <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-muted-foreground">Pair<Input required value={form.pair} onChange={set("pair")} placeholder="EURUSD" /></label>
              <label className="space-y-1 text-xs text-muted-foreground">Entry<Input value={form.entry} onChange={set("entry")} placeholder="1.0850" /></label>
              <label className="space-y-1 text-xs text-muted-foreground">Risk<Input value={form.risk} onChange={set("risk")} placeholder="1 %" /></label>
              <div className="space-y-1 text-xs text-muted-foreground">Result
                <div className="flex gap-2">
                  {(["Win", "Loss"] as const).map((r) => (
                    <Button key={r} type="button" variant={form.result === r ? "default" : "outline"} className="flex-1" onClick={() => setForm({ ...form, result: r })}>{r}</Button>
                  ))}
                </div>
              </div>
              <label className="space-y-1 text-xs text-muted-foreground">Link before trade<Input type="url" value={form.before} onChange={set("before")} placeholder="https://www.tradingview.com/x/..." /></label>
              <label className="space-y-1 text-xs text-muted-foreground">Link after trade<Input type="url" value={form.after} onChange={set("after")} placeholder="https://www.tradingview.com/x/..." /></label>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Save trade</Button>
              </div>
            </form>
          </Panel>
        )}

        <Panel title="Trade history">
          {trades.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trades yet — click "Add trade".</p>
          ) : (
            <div className="space-y-3">
              {trades.map((t) => (
                <article key={t.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-4 text-sm">
                  <span className="font-mono text-muted-foreground">{new Date(t.date).toLocaleDateString()}</span>
                  <span className="font-mono font-semibold">{t.pair}</span>
                  {t.entry && <span className="text-muted-foreground">Entry <span className="font-mono text-foreground">{t.entry}</span></span>}
                  {t.risk && <span className="text-muted-foreground">Risk <span className="font-mono text-foreground">{t.risk}</span></span>}
                  <span className={t.result === "Win" ? "font-semibold text-success" : "font-semibold text-destructive"}>{t.result}</span>
                  <div className="ml-auto flex items-center gap-3">
                    {t.before && <a href={t.before} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">Before <ExternalLink className="h-3 w-3" /></a>}
                    {t.after && <a href={t.after} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">After <ExternalLink className="h-3 w-3" /></a>}
                    <button type="button" aria-label="Delete trade" onClick={() => save(trades.filter((x) => x.id !== t.id))} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

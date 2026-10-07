import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { generateBias, getMyBias, type BiasItem, type BiasReport } from "@/lib/ai-bias.functions";

type Inst = { pair: string; category: string };

function Pill({ b }: { b: BiasItem["daily"] }) {
  const cls =
    b.direction === "Bullish"
      ? "text-success border-success/40"
      : b.direction === "Bearish"
        ? "text-destructive border-destructive/40"
        : "text-muted-foreground border-border";
  return (
    <div className="rounded-md border border-border/60 bg-background/40 p-2">
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{b.direction}</span>
        <span className="font-mono text-sm font-semibold">{b.confidence}%</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded bg-secondary">
        <div className="h-full bg-primary" style={{ width: `${b.confidence}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{b.reason}</p>
    </div>
  );
}

const GROUPS = ["Forex", "Commodities", "Indices"];

export function BiasPanel({ instruments }: { instruments: Inst[] }) {
  const fetchBias = useServerFn(getMyBias);
  const runBias = useServerFn(generateBias);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [report, setReport] = useState<BiasReport | null>(null);
  const [at, setAt] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSignedIn(!!data.session);
      if (!data.session) return;
      try {
        const r = await fetchBias();
        setReport(r.report);
        setAt(r.generatedAt);
        if (r.error) setErr(r.error);
      } catch {}
    });
  }, [fetchBias]);

  const toggle = (p: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(p)) n.delete(p);
      else n.add(p);
      return n;
    });
  const setGroup = (g: string | null) =>
    setSel(new Set(instruments.filter((i) => g === null || i.category === g).map((i) => i.pair)));

  const run = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await runBias({ data: { pairs: [...sel] } });
      setReport(r.report);
      setAt(r.generatedAt);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  };

  const shown = useMemo(
    () => (report?.items ?? []).filter((i) => sel.size === 0 || sel.has(i.pair)),
    [report, sel],
  );

  if (signedIn === false)
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm">
        <Link to="/auth" className="text-primary underline">Sign in</Link> to generate the AI daily & weekly bias.
      </div>
    );

  return (
    <div>
      <div className="mb-4 rounded-lg border border-border bg-card p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold">Instruments</span>
          <button type="button" onClick={() => setGroup(null)} className="rounded-full border border-border px-2.5 py-1 hover:bg-secondary">All</button>
          {GROUPS.map((g) => (
            <button key={g} type="button" onClick={() => setGroup(g)} className="rounded-full border border-border px-2.5 py-1 hover:bg-secondary">{g}</button>
          ))}
          <button type="button" onClick={() => setSel(new Set())} className="rounded-full border border-border px-2.5 py-1 text-muted-foreground hover:bg-secondary">Clear</button>
          <span className="ml-auto text-muted-foreground">{sel.size ? `${sel.size} selected` : "None selected = all"}</span>
        </div>
        {GROUPS.map((g) => (
          <div key={g} className="mt-2">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{g}</div>
            <div className="flex flex-wrap gap-1.5">
              {instruments.filter((i) => i.category === g).map((i) => (
                <button
                  key={i.pair}
                  type="button"
                  onClick={() => toggle(i.pair)}
                  className={
                    sel.has(i.pair)
                      ? "rounded-md bg-primary px-2 py-1 font-mono text-[11px] text-primary-foreground"
                      : "rounded-md border border-border px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-secondary"
                  }
                >
                  {i.pair}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>
            {at ? `Last generated ${new Date(at).toLocaleString("en-US")}.` : "No report yet."} Percent = AI confidence, not a guaranteed probability. Not financial advice.
          </span>
          <button
            type="button"
            onClick={run}
            disabled={busy}
            className="ml-auto rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
          >
            {busy ? "AI is analyzing…" : `Generate bias${sel.size ? ` (${sel.size})` : " (all)"}`}
          </button>
        </div>
      </div>
      {err && <p className="mb-4 text-sm text-destructive">{err}</p>}
      {GROUPS.map((g) => {
        const items = shown.filter((i) => i.category === g);
        if (!items.length) return null;
        return (
          <section key={g} className="mb-8">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{g}</h3>
            <div className="stagger-children grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((i) => (
                <div key={i.pair} className="card-luxe rounded-lg border border-border p-3">
                  <div className="mb-2 font-mono text-sm font-medium">{i.pair}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Daily</div>
                      <Pill b={i.daily} />
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Weekly</div>
                      <Pill b={i.weekly} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

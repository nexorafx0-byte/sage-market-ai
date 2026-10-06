import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { generateBias, getMyBias, type BiasItem, type BiasReport } from "@/lib/ai-bias.functions";

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

export function BiasPanel() {
  const fetchBias = useServerFn(getMyBias);
  const runBias = useServerFn(generateBias);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [report, setReport] = useState<BiasReport | null>(null);
  const [at, setAt] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSignedIn(!!data.session);
      if (!data.session) return;
      try {
        const r = await fetchBias();
        setReport(r.report);
        setAt(r.generatedAt);
      } catch {}
    });
  }, [fetchBias]);

  const run = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await runBias();
      setReport(r.report);
      setAt(r.generatedAt);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  };

  if (signedIn === false)
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm">
        <Link to="/auth" className="text-primary underline">Sign in</Link> to generate the AI daily & weekly bias.
      </div>
    );

  const groups = ["Forex", "Commodities", "Indices"];
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
        <span>
          {at ? `Generated ${new Date(at).toLocaleString("en-US")}` : "No report yet."} Percent = AI confidence, not a guaranteed probability. Not financial advice.
        </span>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="ml-auto rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy ? "AI is analyzing…" : report ? "Regenerate" : "Generate bias"}
        </button>
      </div>
      {err && <p className="mb-4 text-sm text-destructive">{err}</p>}
      {report &&
        groups.map((g) => {
          const items = report.items.filter((i) => i.category === g);
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

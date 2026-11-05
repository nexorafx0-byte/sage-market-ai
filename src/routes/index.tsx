import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight, LineChart } from "lucide-react";
import { HomepageGuide, HomepageWorkflow } from "@/components/homepage-guide";
import overview from "@/assets/marketmind-overview.asset.json";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MARKETMIND — AI market analysis, COT and seasonality" },
      {
        name: "description",
        content:
          "Explore MARKETMIND: fundamental scores, COT, seasonality, AI bias, charts, news, Journal and risk planning, with usage guides and data limitations.",
      },
      { property: "og:title", content: "MARKETMIND — Trading tools and feature guide" },
      {
        property: "og:description",
        content:
          "Discover MARKETMIND trading tools, learn how to use them together and understand their data limitations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const plans = [
  { name: "Free", price: "0", period: "first month", items: ["AI macro analysis", "Currency Strength", "Fundamental Score", "News calendar"] },
  { name: "Monthly", price: "79", period: "month", highlight: true, items: ["Everything in Free", "COT & seasonality", "Supply & Demand", "Journal & trading plan", "Risk manager", "Daily & Weekly Bias"] },
  { name: "Yearly", price: "900", period: "year · save 48 €", items: ["Everything in Monthly", "Real-time AI alerts", "Mobile app", "Priority support"] },
];

function Landing() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setAuthed(Boolean(session)),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LineChart className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold tracking-tight">MARKETMIND</span>
          <nav className="ml-8 hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#funkcie" className="hover:text-foreground">Features</a>
            <a href="#postup" className="hover:text-foreground">Workflow</a>
            <Link to="/cennik" className="hover:text-foreground">Plans</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {authed ? (
              <Button size="sm" onClick={() => navigate({ to: "/analyza" })}>
                Open analysis
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/auth" })}>
                  Sign in
                </Button>
                <Button size="sm" onClick={() => navigate({ to: "/auth" })}>
                  Try for free
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <img src={overview.url} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-top opacity-20" />
        <div className="absolute inset-0 bg-background/70" />
        <div className="relative mx-auto max-w-4xl px-6 py-14 text-center sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Market context · positioning · historical patterns
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
            MARKETMIND
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Fundamental analysis, COT, seasonality and AI market context.
            Inspect charts, plan your risk and record your trades in one workspace.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate({ to: authed ? "/analyza" : "/auth" })}>
              {authed ? "Open analysis" : "Start for free"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate({ to: "/analyza" })}>
              See the AI analysis
            </Button>
          </div>
        </div>
      </section>

      <HomepageGuide />
      <HomepageWorkflow />

      <section id="cennik" className="border-t border-border bg-card/30 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Pricing</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Compare plans. Listed features do not imply automatic trading or guaranteed outcomes.
          </p>
          <div className="stagger-children mt-10 grid gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`card-luxe rounded-xl border bg-card p-6 shadow-[var(--shadow-card)] ${
                  p.highlight ? "border-primary ring-1 ring-primary/40" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{p.name}</h3>
                  {p.highlight && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                      Most popular
                    </span>
                  )}
                </div>
                <div className="mt-4 font-mono text-3xl font-bold">
                  {p.price} €
                  <span className="text-sm font-normal text-muted-foreground"> /{p.period}</span>
                </div>
                <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                  {p.items.map((i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {i}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={p.highlight ? "default" : "outline"}
                  onClick={() => navigate({ to: "/auth" })}
                >
                  Choose {p.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} MARKETMIND</span>
          <Link to="/auth" className="hover:text-foreground">Sign in</Link>
        </div>
      </footer>
    </div>
  );
}

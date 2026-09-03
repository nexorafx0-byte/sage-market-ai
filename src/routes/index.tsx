import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Brain,
  BookOpen,
  ShieldCheck,
  Wallet,
  FlaskConical,
  CandlestickChart,
  BarChart3,
  Bell,
  CheckCircle2,
  ArrowRight,
  LineChart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Trading Analyzer AI — AI analýza trhu, COT a funded účty" },
      {
        name: "description",
        content:
          "Jedna platforma pre AI makro analýzu, Fundament Score, Currency Strength, COT dáta, sezónnosť, journal, backtesting a správu funded účtov.",
      },
      { property: "og:title", content: "Trading Analyzer AI" },
      {
        property: "og:description",
        content:
          "TradingView, Forex Factory, Finviz a MyFxBook v jednej AI platforme pre traderov.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Brain, title: "AI makro analýza", desc: "Fundament Score od -10 do +10 zo sadzieb, inflácie, HDP a COT dát." },
  { icon: BarChart3, title: "COT & Currency Strength", desc: "Commercials, non-commercials a retail pozície z reálnych CFTC dát." },
  { icon: CandlestickChart, title: "Grafy ako TradingView", desc: "Plnohodnotné grafy, obľúbené páry, timeframy a cenové alerty." },
  { icon: LineChart, title: "Sezónnosť", desc: "5, 10, 15 a 20-ročné sezónne priebehy s presným výberom obdobia." },
  { icon: BookOpen, title: "AI Journal", desc: "Automatické vyhodnotenie obchodov a AI návrh obchodného plánu." },
  { icon: ShieldCheck, title: "Risk manager", desc: "Veľkosť pozície, denný limit a kontrola drawdownu v reálnom čase." },
  { icon: Wallet, title: "Funded účty", desc: "Prepoj MT4, MT5, cTrader, Tradovate či TradeLocker na jeden dashboard." },
  { icon: FlaskConical, title: "Backtesting", desc: "Otestuj stratégiu na historických dátach a porovnaj výsledky." },
  { icon: Bell, title: "AI upozornenia", desc: "Dôležité správy a udalosti, ktoré hýbu tvojimi pármi." },
];

const plans = [
  { name: "Basic", price: "29", items: ["AI makro analýza", "Fundament Score", "Currency Strength", "1 funded účet"] },
  { name: "Pro", price: "79", highlight: true, items: ["Všetko z Basic", "COT & sezónnosť", "AI Journal + plán", "5 funded účtov"] },
  { name: "Elite", price: "149", items: ["Všetko z Pro", "Backtesting", "Prioritné AI alerty", "Neobmedzené účty"] },
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
          <span className="text-sm font-semibold tracking-tight">Trading Analyzer AI</span>
          <nav className="ml-8 hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#funkcie" className="hover:text-foreground">Funkcie</a>
            <a href="#cennik" className="hover:text-foreground">Cenník</a>
            <Link to="/cennik" className="hover:text-foreground">Plány</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {authed ? (
              <Button size="sm" onClick={() => navigate({ to: "/dashboard" })}>
                Otvoriť dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/auth" })}>
                  Prihlásiť sa
                </Button>
                <Button size="sm" onClick={() => navigate({ to: "/auth" })}>
                  Vyskúšať zadarmo
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[46rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Reálne dáta z CFTC, BIS a World Bank
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
            Analyzuj trh s <span className="text-gradient-primary">AI</span>, nie s pocitom
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            TradingView, Forex Factory, Finviz a MyFxBook v jednej platforme. Makro analýza,
            COT, sezónnosť, journal a funded účty — všetko na jednom mieste.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate({ to: authed ? "/dashboard" : "/auth" })}>
              {authed ? "Otvoriť dashboard" : "Začať zadarmo"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate({ to: "/analyza" })}>
              Pozrieť AI analýzu
            </Button>
          </div>
        </div>
      </section>

      <section id="funkcie" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Všetko, čo trader potrebuje
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary/50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="cennik" className="border-t border-border bg-card/30 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Cenník</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Zruš kedykoľvek. Bez viazanosti.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-xl border bg-card p-6 shadow-[var(--shadow-card)] ${
                  p.highlight ? "border-primary ring-1 ring-primary/40" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{p.name}</h3>
                  {p.highlight && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                      Najobľúbenejší
                    </span>
                  )}
                </div>
                <div className="mt-4 font-mono text-3xl font-bold">
                  {p.price} €
                  <span className="text-sm font-normal text-muted-foreground"> /mes.</span>
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
                  Vybrať {p.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Trading Analyzer AI</span>
          <Link to="/auth" className="hover:text-foreground">Prihlásenie</Link>
        </div>
      </footer>
    </div>
  );
}

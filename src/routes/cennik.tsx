import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cennik")({
  head: () => ({
    meta: [
      { title: "Cenník — Trading Analyzer AI" },
      {
        name: "description",
        content: "Basic 29 €, Pro 79 € a Elite 149 € mesačne. Vyber si plán pre svoje obchodovanie.",
      },
      { property: "og:title", content: "Cenník — Trading Analyzer AI" },
      { property: "og:description", content: "Basic 29 € · Pro 79 € · Elite 149 € mesačne." },
    ],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: "Basic",
    price: "29 €",
    desc: "Pre začínajúcich obchodníkov",
    features: [
      "AI makro analýza (denne)",
      "Currency Strength",
      "Fundament Score",
      "Kalendár správ",
      "1 obchodný účet",
    ],
  },
  {
    name: "Pro",
    price: "79 €",
    desc: "Pre aktívnych obchodníkov",
    highlight: true,
    features: [
      "Všetko z Basic",
      "COT a sezónnosť",
      "Supply & Demand analýza",
      "AI Journal a obchodný plán",
      "Risk manager · 5 účtov",
    ],
  },
  {
    name: "Elite",
    price: "149 €",
    desc: "Pre funded a profesionálov",
    features: [
      "Všetko z Pro",
      "Backtesting bez limitov",
      "Dashboard pre funded účty",
      "AI upozornenia v reálnom čase",
      "Mobilná aplikácia a prioritná podpora",
    ],
  },
];

function PricingPage() {
  return (
    <>
      <PageHeader title="Cenník" subtitle="Zruš kedykoľvek · 7 dní zadarmo" />
      <div className="grid gap-5 p-6 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={cn(
              "rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]",
              p.highlight ? "border-primary ring-1 ring-primary" : "border-border",
            )}
          >
            {p.highlight && (
              <span className="mb-3 inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                Najobľúbenejší
              </span>
            )}
            <h2 className="text-lg font-semibold tracking-tight">{p.name}</h2>
            <p className="text-sm text-muted-foreground">{p.desc}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-mono text-4xl font-bold">{p.price}</span>
              <span className="text-sm text-muted-foreground">/mesiac</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button className="mt-6 w-full" variant={p.highlight ? "default" : "outline"}>
              Vybrať {p.name}
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}

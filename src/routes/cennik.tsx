import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cennik")({
  head: () => ({
    meta: [
      { title: "Pricing — MARKETMIND" },
      {
        name: "description",
        content: "Basic €29, Pro €79, and Elite €149 per month. Choose the plan for your trading.",
      },
      { property: "og:title", content: "Pricing — MARKETMIND" },
      { property: "og:description", content: "Basic €29 · Pro €79 · Elite €149 per month." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: "Basic",
    price: "29 €",
    desc: "For beginner traders",
    features: [
      "AI macro analysis (daily)",
      "Currency Strength",
      "Fundamental Score",
      "News calendar",
      "1 trading account",
    ],
  },
  {
    name: "Pro",
    price: "79 €",
    desc: "For active traders",
    highlight: true,
    features: [
      "Everything in Basic",
      "COT and Seasonality",
      "Supply & Demand analysis",
      "AI Journal and trading plan",
      "Risk manager",
    ],
  },
  {
    name: "Elite",
    price: "149 €",
    desc: "For professionals",
    features: [
      "Everything in Pro",
      "Real-time AI alerts",
      "Mobile app and priority support",
    ],
  },
];

function PricingPage() {
  return (
    <>
      <PageHeader title="Pricing" subtitle="Cancel anytime · 7 days free" />
      <div className="stagger-children grid gap-5 p-6 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={cn(
              "card-luxe rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]",
              p.highlight ? "border-primary ring-1 ring-primary" : "border-border",
            )}
          >
            {p.highlight && (
              <span className="mb-3 inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                Most popular
              </span>
            )}
            <h2 className="text-lg font-semibold tracking-tight">{p.name}</h2>
            <p className="text-sm text-muted-foreground">{p.desc}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-mono text-4xl font-bold">{p.price}</span>
              <span className="text-sm text-muted-foreground">/month</span>
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
              Choose {p.name}
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}

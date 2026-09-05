import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="animate-rise flex flex-wrap items-end justify-between gap-4 border-b border-border bg-card px-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Panel({
  title,
  hint,
  children,
  className,
  action,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "card-luxe animate-rise rounded-xl border border-border bg-card shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  delta,
  tone = "neutral",
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <div className="card-luxe rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold text-foreground">{value}</div>
      {delta && (
        <div
          className={cn(
            "mt-1 text-xs font-medium",
            tone === "positive" && "text-success",
            tone === "negative" && "text-destructive",
            tone === "neutral" && "text-muted-foreground",
          )}
        >
          {delta}
        </div>
      )}
    </div>
  );
}

export function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (Math.abs(value) / max) * 100));
  const negative = value < 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          negative ? "bg-destructive" : "bg-primary",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { JournalTrade, JournalTradeInput } from "@/lib/journal.functions";

const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN"];

type FormState = {
  traded_at: string;
  instrument: string;
  direction: "long" | "short";
  timeframe: string;
  sd_zone: string;
  fundamental: string;
  seasonality: string;
  entry_price: string;
  stop_loss: string;
  take_profit: string;
  lot_size: string;
  risk_pct: string;
  pnl: string;
  rr: string;
  entry_reason: string;
  psychology: string;
  screenshot_url: string;
  rules_followed: boolean;
  rules_broken: string;
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function emptyForm(): FormState {
  return {
    traded_at: toLocalInput(new Date().toISOString()),
    instrument: "",
    direction: "long",
    timeframe: "H1",
    sd_zone: "",
    fundamental: "",
    seasonality: "",
    entry_price: "",
    stop_loss: "",
    take_profit: "",
    lot_size: "",
    risk_pct: "",
    pnl: "",
    rr: "",
    entry_reason: "",
    psychology: "",
    screenshot_url: "",
    rules_followed: true,
    rules_broken: "",
  };
}

function fromTrade(t: JournalTrade): FormState {
  const s = (v: number | null) => (v === null || v === undefined ? "" : String(v));
  return {
    traded_at: toLocalInput(t.traded_at),
    instrument: t.instrument,
    direction: t.direction,
    timeframe: t.timeframe ?? "",
    sd_zone: t.sd_zone ?? "",
    fundamental: t.fundamental ?? "",
    seasonality: t.seasonality ?? "",
    entry_price: s(t.entry_price),
    stop_loss: s(t.stop_loss),
    take_profit: s(t.take_profit),
    lot_size: s(t.lot_size),
    risk_pct: s(t.risk_pct),
    pnl: s(t.pnl),
    rr: s(t.rr),
    entry_reason: t.entry_reason ?? "",
    psychology: t.psychology ?? "",
    screenshot_url: t.screenshot_url ?? "",
    rules_followed: t.rules_followed,
    rules_broken: t.rules_broken ?? "",
  };
}

const num = (v: string) => (v.trim() === "" ? null : Number(v));

function autoRR(f: FormState): string {
  const e = Number(f.entry_price);
  const sl = Number(f.stop_loss);
  const tp = Number(f.take_profit);
  if (!e || !sl || !tp) return f.rr;
  const risk = Math.abs(e - sl);
  const reward = Math.abs(tp - e);
  if (!risk) return f.rr;
  return (reward / risk).toFixed(2);
}

export function TradeDialog({
  open,
  onOpenChange,
  trade,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  trade: JournalTrade | null;
  onSave: (input: JournalTradeInput) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (open) setForm(trade ? fromTrade(trade) : emptyForm());
  }, [open, trade]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    if (!form.instrument.trim()) return;
    onSave({
      ...(trade ? { id: trade.id } : {}),
      traded_at: new Date(form.traded_at).toISOString(),
      instrument: form.instrument.trim().toUpperCase(),
      direction: form.direction,
      timeframe: form.timeframe || null,
      sd_zone: form.sd_zone || null,
      fundamental: form.fundamental || null,
      seasonality: form.seasonality || null,
      entry_price: num(form.entry_price),
      stop_loss: num(form.stop_loss),
      take_profit: num(form.take_profit),
      lot_size: num(form.lot_size),
      risk_pct: num(form.risk_pct),
      pnl: num(form.pnl),
      rr: num(form.rr),
      entry_reason: form.entry_reason || null,
      psychology: form.psychology || null,
      screenshot_url: form.screenshot_url || null,
      rules_followed: form.rules_followed,
      rules_broken: form.rules_broken || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trade ? "Edit trade" : "New trade"}</DialogTitle>
          <DialogDescription>
            Log the full context of the setup — execution, fundamentals and psychology.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="📅 Date & time">
            <Input
              type="datetime-local"
              value={form.traded_at}
              onChange={(e) => set("traded_at", e.target.value)}
            />
          </Field>
          <Field label="💱 Instrument / pair">
            <Input
              value={form.instrument}
              placeholder="EURUSD"
              onChange={(e) => set("instrument", e.target.value)}
            />
          </Field>

          <Field label="📈 Direction">
            <div className="grid grid-cols-2 gap-2">
              {(["long", "short"] as const).map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant={form.direction === d ? "default" : "outline"}
                  onClick={() => set("direction", d)}
                >
                  {d === "long" ? "LONG" : "SHORT"}
                </Button>
              ))}
            </div>
          </Field>
          <Field label="🕐 Timeframe">
            <div className="flex flex-wrap gap-1.5">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => set("timeframe", tf)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                    form.timeframe === tf
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </Field>

          <Field label="🎯 Supply & Demand zone" full>
            <Input
              value={form.sd_zone}
              placeholder="H4 demand 1.0820–1.0845, first retest"
              onChange={(e) => set("sd_zone", e.target.value)}
            />
          </Field>

          <Field label="📰 Fundamentals">
            <Textarea
              rows={2}
              className="resize-none"
              value={form.fundamental}
              placeholder="Score, rates, CPI, COT bias…"
              onChange={(e) => set("fundamental", e.target.value)}
            />
          </Field>
          <Field label="📊 Seasonality">
            <Textarea
              rows={2}
              className="resize-none"
              value={form.seasonality}
              placeholder="September bullish in 8 of last 10 years"
              onChange={(e) => set("seasonality", e.target.value)}
            />
          </Field>

          <Field label="💰 Entry">
            <Input
              inputMode="decimal"
              value={form.entry_price}
              onChange={(e) => set("entry_price", e.target.value)}
              onBlur={() => set("rr", autoRR(form))}
            />
          </Field>
          <Field label="🛑 Stop loss">
            <Input
              inputMode="decimal"
              value={form.stop_loss}
              onChange={(e) => set("stop_loss", e.target.value)}
              onBlur={() => set("rr", autoRR(form))}
            />
          </Field>
          <Field label="🎯 Take profit">
            <Input
              inputMode="decimal"
              value={form.take_profit}
              onChange={(e) => set("take_profit", e.target.value)}
              onBlur={() => set("rr", autoRR(form))}
            />
          </Field>
          <Field label="📊 R:R">
            <Input
              inputMode="decimal"
              value={form.rr}
              placeholder="auto from entry / SL / TP"
              onChange={(e) => set("rr", e.target.value)}
            />
          </Field>

          <Field label="📏 Lot size">
            <Input
              inputMode="decimal"
              value={form.lot_size}
              onChange={(e) => set("lot_size", e.target.value)}
            />
          </Field>
          <Field label="📏 Risk %">
            <Input
              inputMode="decimal"
              value={form.risk_pct}
              onChange={(e) => set("risk_pct", e.target.value)}
            />
          </Field>
          <Field label="💵 P&L (€)">
            <Input
              inputMode="decimal"
              value={form.pnl}
              placeholder="-120.50"
              onChange={(e) => set("pnl", e.target.value)}
            />
          </Field>
          <Field label="📸 Screenshot link">
            <Input
              value={form.screenshot_url}
              placeholder="https://…"
              onChange={(e) => set("screenshot_url", e.target.value)}
            />
          </Field>

          <Field label="🧠 Entry reason" full>
            <Textarea
              rows={3}
              className="resize-none"
              value={form.entry_reason}
              onChange={(e) => set("entry_reason", e.target.value)}
            />
          </Field>
          <Field label="😎 Psychology / emotions" full>
            <Textarea
              rows={2}
              className="resize-none"
              value={form.psychology}
              placeholder="Calm, patient, no FOMO…"
              onChange={(e) => set("psychology", e.target.value)}
            />
          </Field>

          <div className="sm:col-span-2 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-sm">✅ Rules followed</Label>
              <Switch
                checked={form.rules_followed}
                onCheckedChange={(v) => set("rules_followed", v)}
              />
            </div>
            {!form.rules_followed && (
              <Textarea
                rows={2}
                className="mt-3 resize-none"
                value={form.rules_broken}
                placeholder="Which rules were broken?"
                onChange={(e) => set("rules_broken", e.target.value)}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !form.instrument.trim()}>
            {saving ? "Saving…" : "Save trade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

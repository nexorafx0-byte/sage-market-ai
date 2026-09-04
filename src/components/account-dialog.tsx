import { useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PLATFORMS, type PlatformValue, type TradingAccount } from "@/lib/accounts.functions";

export type AccountFormValues = {
  id?: string;
  name: string;
  prop_firm: string | null;
  platform: PlatformValue;
  phase: string;
  account_login: string | null;
  server: string | null;
  currency: string;
  start_balance: number;
  balance: number;
  profit_target_pct: number;
  max_dd_pct: number;
  current_dd_pct: number;
  notes: string | null;
  investor_password?: string | null;
  api_token?: string | null;
};

const empty: AccountFormValues = {
  name: "",
  prop_firm: "",
  platform: "mt5",
  phase: "Funded",
  account_login: "",
  server: "",
  currency: "EUR",
  start_balance: 100000,
  balance: 100000,
  profit_target_pct: 8,
  max_dd_pct: 10,
  current_dd_pct: 0,
  notes: "",
};

export function AccountDialog({
  open,
  onOpenChange,
  account,
  onSubmit,
  busy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  account?: TradingAccount | null;
  onSubmit: (values: AccountFormValues) => void;
  busy?: boolean;
}) {
  const [form, setForm] = useState<AccountFormValues>(
    account ? { ...empty, ...account, notes: account.notes ?? "" } : empty,
  );

  const set = <K extends keyof AccountFormValues>(key: K, value: AccountFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const num = (v: string) => (v === "" ? 0 : Number(v));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{account ? "Edit account" : "Add trading account"}</DialogTitle>
          <DialogDescription>
            Enter the parameters of your challenge or funded account. Broker connection is optional.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="detail">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detail">Account details</TabsTrigger>
            <TabsTrigger value="connect">Pripojenie</TabsTrigger>
          </TabsList>

          <TabsContent value="detail" className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Account name">
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Prop firma">
                <Input
                  value={form.prop_firm ?? ""}
                  onChange={(e) => set("prop_firm", e.target.value)}
                  placeholder="FTMO, FundingPips…"
                />
              </Field>
              <Field label="Platforma">
                <Select
                  value={form.platform}
                  onValueChange={(v) => set("platform", v as PlatformValue)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Phase">
                <Select value={form.phase} onValueChange={(v) => set("phase", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Phase 1", "Phase 2", "Funded", "Demo", "Live"].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Mena">
                <Input value={form.currency} onChange={(e) => set("currency", e.target.value)} />
              </Field>
              <Field label="Initial capital">
                <Input
                  type="number"
                  value={form.start_balance}
                  onChange={(e) => set("start_balance", num(e.target.value))}
                />
              </Field>
              <Field label="Current balance">
                <Input
                  type="number"
                  value={form.balance}
                  onChange={(e) => set("balance", num(e.target.value))}
                />
              </Field>
              <Field label="Profit target (%)">
                <Input
                  type="number"
                  value={form.profit_target_pct}
                  onChange={(e) => set("profit_target_pct", num(e.target.value))}
                />
              </Field>
              <Field label="Max. drawdown (%)">
                <Input
                  type="number"
                  value={form.max_dd_pct}
                  onChange={(e) => set("max_dd_pct", num(e.target.value))}
                />
              </Field>
              <Field label="Current drawdown (%)">
                <Input
                  type="number"
                  value={form.current_dd_pct}
                  onChange={(e) => set("current_dd_pct", num(e.target.value))}
                />
              </Field>
            </div>
            <Field label="Note">
              <Textarea
                rows={2}
                value={form.notes ?? ""}
                onChange={(e) => set("notes", e.target.value)}
              />
            </Field>
          </TabsContent>

          <TabsContent value="connect" className="space-y-4 pt-4">
            <p className="rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
              Enter <strong>read-only access only</strong> (investor password for MT4/MT5 or an API
              token for cTrader, Tradovate and TradeLocker). Credentials are stored separately and are never
              returned to the browser. After saving, the account gets the status “Waiting for sync”.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Account number / login">
                <Input
                  value={form.account_login ?? ""}
                  onChange={(e) => set("account_login", e.target.value)}
                />
              </Field>
              <Field label="Server">
                <Input
                  value={form.server ?? ""}
                  onChange={(e) => set("server", e.target.value)}
                  placeholder="FTMO-Server2"
                />
              </Field>
            </div>
            <Field label="Investor heslo (MT4 / MT5)">
              <Input
                type="password"
                autoComplete="off"
                value={form.investor_password ?? ""}
                onChange={(e) => set("investor_password", e.target.value)}
              />
            </Field>
            <Field label="API token (cTrader / Tradovate / TradeLocker)">
              <Input
                type="password"
                autoComplete="off"
                value={form.api_token ?? ""}
                onChange={(e) => set("api_token", e.target.value)}
              />
            </Field>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Zrušiť
          </Button>
          <Button disabled={busy || !form.name.trim()} onClick={() => onSubmit(form)}>
            Uložiť
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

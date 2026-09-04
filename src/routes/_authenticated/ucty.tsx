import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, Unplug, Pencil, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AccountDialog, type AccountFormValues } from "@/components/account-dialog";
import { PageHeader, Panel } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  PLATFORMS,
  deleteAccount,
  disconnectAccount,
  listAccounts,
  saveAccount,
  type TradingAccount,
} from "@/lib/accounts.functions";

export const Route = createFileRoute("/_authenticated/ucty")({
  head: () => ({
    meta: [
      { title: "Funded accounts — Trading Analyzer AI" },
      {
        name: "description",
        content:
          "Connect MT4, MT5, cTrader, Tradovate and TradeLocker accounts and track targets and drawdown in one place.",
      },
      { property: "og:title", content: "Funded accounts — Trading Analyzer AI" },
      {
        property: "og:description",
        content: "All prop firm accounts and broker connections on one screen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountsPage,
});

const statusLabel: Record<TradingAccount["connection_status"], string> = {
  manual: "Manual",
  pending: "Waiting for sync",
  connected: "Connected",
  error: "Chyba pripojenia",
};

function AccountsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchAccounts = useServerFn(listAccounts);
  const save = useServerFn(saveAccount);
  const remove = useServerFn(deleteAccount);
  const disconnect = useServerFn(disconnectAccount);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TradingAccount | null>(null);

  const accounts = useQuery({
    queryKey: ["trading-accounts"],
    queryFn: () => fetchAccounts(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["trading-accounts"] });

  const saveMutation = useMutation({
    mutationFn: (values: AccountFormValues) =>
      save({
        data: {
          ...values,
          prop_firm: values.prop_firm || null,
          account_login: values.account_login || null,
          server: values.server || null,
          notes: values.notes || null,
          investor_password: values.investor_password || null,
          api_token: values.api_token || null,
        },
      }),
    onSuccess: (res) => {
      setDialogOpen(false);
      setEditing(null);
      invalidate();
      toast.success(
        res.connectionRequested ? "Account saved, connection is being prepared." : "Account saved.",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Account deleted.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const disconnectMutation = useMutation({
    mutationFn: (id: string) => disconnect({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Connection removed.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    await navigate({ to: "/auth" });
  };

  const list = accounts.data ?? [];

  return (
    <>
      <PageHeader
        title="Funded accounts"
        subtitle="Prepoj MT4, MT5, cTrader, Tradovate alebo TradeLocker a sleduj ciele aj drawdown"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> Sign out
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add account
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {accounts.isLoading && <p className="text-sm text-muted-foreground">Loading accounts…</p>}

        {!accounts.isLoading && list.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <h2 className="text-base font-semibold">You don't have any account yet</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Add your challenge or funded account. For MT4/MT5 an investor password is enough; for cTrader, Tradovate and TradeLocker an API token.
            </p>
            <Button
              className="mt-5"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add first account
            </Button>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          {list.map((a) => {
            const profit = Number(a.balance) - Number(a.start_balance);
            const targetPct =
              Number(a.profit_target_pct) > 0 && Number(a.start_balance) > 0
                ? Math.max(
                    0,
                    Math.min(
                      100,
                      (profit / ((Number(a.start_balance) * Number(a.profit_target_pct)) / 100)) *
                        100,
                    ),
                  )
                : 0;
            const platform = PLATFORMS.find((p) => p.value === a.platform)?.label ?? a.platform;

            return (
              <Panel key={a.id} title={a.name} hint={`${a.prop_firm ?? platform} · ${a.phase}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-3xl font-semibold">
                      {Number(a.balance).toLocaleString("sk-SK")} {a.currency}
                    </div>
                    <div
                      className={
                        profit >= 0
                          ? "mt-1 font-mono text-sm text-success"
                          : "mt-1 font-mono text-sm text-destructive"
                      }
                    >
                      {profit >= 0 ? "+" : ""}
                      {profit.toLocaleString("sk-SK")} {a.currency}
                    </div>
                  </div>
                  <Badge variant={a.connection_status === "connected" ? "default" : "secondary"}>
                    {statusLabel[a.connection_status]}
                  </Badge>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress to target</span>
                      <span className="font-mono">{targetPct.toFixed(0)} %</span>
                    </div>
                    <Progress value={targetPct} className="mt-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Drawdown</span>
                      <span className="font-mono">
                        {Number(a.current_dd_pct)} % / {Number(a.max_dd_pct)} %
                      </span>
                    </div>
                    <Progress
                      value={
                        Number(a.max_dd_pct) > 0
                          ? (Number(a.current_dd_pct) / Number(a.max_dd_pct)) * 100
                          : 0
                      }
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(a);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>
                  {a.connection_status !== "manual" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => disconnectMutation.mutate(a.id)}
                    >
                      <Unplug className="mr-1.5 h-3.5 w-3.5" /> Disconnect
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeMutation.mutate(a.id)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </Panel>
            );
          })}
        </div>
      </div>

      {dialogOpen && (
        <AccountDialog
          key={editing?.id ?? "new"}
          open={dialogOpen}
          onOpenChange={(v) => {
            setDialogOpen(v);
            if (!v) setEditing(null);
          }}
          account={editing}
          busy={saveMutation.isPending}
          onSubmit={(values) => saveMutation.mutate(values)}
        />
      )}
    </>
  );
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const PLATFORMS = [
  { value: "mt5", label: "MetaTrader 5" },
  { value: "mt4", label: "MetaTrader 4" },
  { value: "ctrader", label: "cTrader" },
  { value: "tradovate", label: "Tradovate" },
  { value: "tradelocker", label: "TradeLocker" },
  { value: "other", label: "Iná platforma" },
] as const;

export type PlatformValue = (typeof PLATFORMS)[number]["value"];

export type TradingAccount = {
  id: string;
  name: string;
  prop_firm: string | null;
  platform: PlatformValue;
  phase: string;
  account_login: string | null;
  server: string | null;
  currency: string;
  start_balance: number;
  balance: number;
  equity: number | null;
  profit_target_pct: number;
  max_dd_pct: number;
  current_dd_pct: number;
  connection_status: "manual" | "pending" | "connected" | "error";
  connection_error: string | null;
  last_sync_at: string | null;
  notes: string | null;
};

const accountSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(80),
  prop_firm: z.string().max(80).nullable().optional(),
  platform: z.enum(["mt5", "mt4", "ctrader", "tradovate", "tradelocker", "other"]),
  phase: z.string().min(1).max(40),
  account_login: z.string().max(60).nullable().optional(),
  server: z.string().max(120).nullable().optional(),
  currency: z.string().min(1).max(6),
  start_balance: z.number().min(0),
  balance: z.number().min(0),
  profit_target_pct: z.number().min(0).max(1000),
  max_dd_pct: z.number().min(0).max(100),
  current_dd_pct: z.number().min(0).max(100),
  notes: z.string().max(500).nullable().optional(),
  // Voliteľné pripojenie k brokerovi (read-only investor prístup)
  investor_password: z.string().max(200).nullable().optional(),
  api_token: z.string().max(400).nullable().optional(),
});

const SELECT_COLUMNS =
  "id,name,prop_firm,platform,phase,account_login,server,currency,start_balance,balance,equity,profit_target_pct,max_dd_pct,current_dd_pct,connection_status,connection_error,last_sync_at,notes";

export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("trading_accounts")
      .select(SELECT_COLUMNS)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as TradingAccount[];
  });

export const saveAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => accountSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { id, investor_password, api_token, ...fields } = data;
    const hasCredentials = Boolean(investor_password || api_token);

    const row = {
      ...fields,
      user_id: context.userId,
      ...(hasCredentials ? { connection_status: "pending" as const, connection_error: null } : {}),
    };

    let accountId = id;
    if (id) {
      const { error } = await context.supabase
        .from("trading_accounts")
        .update(row)
        .eq("id", id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    } else {
      const { data: inserted, error } = await context.supabase
        .from("trading_accounts")
        .insert(row)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      accountId = inserted.id;
    }

    if (hasCredentials && accountId) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("account_connection_secrets").upsert(
        {
          account_id: accountId,
          user_id: context.userId,
          investor_password: investor_password ?? null,
          api_token: api_token ?? null,
        },
        { onConflict: "account_id" },
      );
      if (error) throw new Error(error.message);
    }

    return { id: accountId, connectionRequested: hasCredentials };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("trading_accounts")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const disconnectAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("trading_accounts")
      .update({ connection_status: "manual", connection_error: null, last_sync_at: null })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("account_connection_secrets").delete().eq("account_id", data.id);
    return { ok: true };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type JournalTrade = {
  id: string;
  account_id: string | null;
  traded_at: string;
  instrument: string;
  direction: "long" | "short";
  timeframe: string | null;
  sd_zone: string | null;
  fundamental: string | null;
  seasonality: string | null;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  lot_size: number | null;
  risk_pct: number | null;
  pnl: number | null;
  rr: number | null;
  entry_reason: string | null;
  psychology: string | null;
  screenshot_url: string | null;
  rules_followed: boolean;
  rules_broken: string | null;
};

const nullableNumber = z
  .union([z.number(), z.null()])
  .optional()
  .transform((v) => (v === undefined ? null : v));

const nullableText = (max: number) =>
  z
    .union([z.string().max(max), z.null()])
    .optional()
    .transform((v) => (v === undefined || v === "" ? null : v));

const tradeSchema = z.object({
  id: z.string().uuid().optional(),
  account_id: z.string().uuid().nullable().optional(),
  traded_at: z.string().min(4),
  instrument: z.string().min(1).max(40),
  direction: z.enum(["long", "short"]),
  timeframe: nullableText(20),
  sd_zone: nullableText(200),
  fundamental: nullableText(500),
  seasonality: nullableText(500),
  entry_price: nullableNumber,
  stop_loss: nullableNumber,
  take_profit: nullableNumber,
  lot_size: nullableNumber,
  risk_pct: nullableNumber,
  pnl: nullableNumber,
  rr: nullableNumber,
  entry_reason: nullableText(2000),
  psychology: nullableText(1000),
  screenshot_url: nullableText(600),
  rules_followed: z.boolean(),
  rules_broken: nullableText(1000),
});

export type JournalTradeInput = z.input<typeof tradeSchema>;

const SELECT_COLUMNS =
  "id,account_id,traded_at,instrument,direction,timeframe,sd_zone,fundamental,seasonality,entry_price,stop_loss,take_profit,lot_size,risk_pct,pnl,rr,entry_reason,psychology,screenshot_url,rules_followed,rules_broken";

export const listTrades = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("journal_trades")
      .select(SELECT_COLUMNS)
      .order("traded_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as JournalTrade[];
  });

export const saveTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => tradeSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { id, ...fields } = data;
    const row = { ...fields, user_id: context.userId };

    if (id) {
      const { error } = await context.supabase
        .from("journal_trades")
        .update(row)
        .eq("id", id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
      return { id };
    }

    const { data: inserted, error } = await context.supabase
      .from("journal_trades")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id as string };
  });

export const deleteTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("journal_trades")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

CREATE TABLE public.journal_trades (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.trading_accounts(id) ON DELETE SET NULL,
  traded_at timestamp with time zone NOT NULL DEFAULT now(),
  instrument text NOT NULL,
  direction text NOT NULL DEFAULT 'long',
  timeframe text,
  sd_zone text,
  fundamental text,
  seasonality text,
  entry_price numeric,
  stop_loss numeric,
  take_profit numeric,
  lot_size numeric,
  risk_pct numeric,
  pnl numeric,
  rr numeric,
  entry_reason text,
  psychology text,
  screenshot_url text,
  rules_followed boolean NOT NULL DEFAULT true,
  rules_broken text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_trades TO authenticated;
GRANT ALL ON public.journal_trades TO service_role;

ALTER TABLE public.journal_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own journal trades" ON public.journal_trades
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER journal_trades_set_updated_at
  BEFORE UPDATE ON public.journal_trades
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX journal_trades_user_date_idx ON public.journal_trades (user_id, traded_at DESC);
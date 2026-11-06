CREATE TABLE public.backtests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled backtest',
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  trades JSONB NOT NULL DEFAULT '[]'::jsonb,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  drawings JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT NOT NULL DEFAULT '',
  replay_index INTEGER NOT NULL DEFAULT 0 CHECK (replay_index >= 0),
  data_mode TEXT NOT NULL DEFAULT 'demo' CHECK (data_mode IN ('real', 'demo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX backtests_user_id_updated_at_idx ON public.backtests (user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.backtests TO authenticated;
GRANT ALL ON public.backtests TO service_role;
ALTER TABLE public.backtests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own backtests" ON public.backtests FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER backtests_set_updated_at BEFORE UPDATE ON public.backtests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
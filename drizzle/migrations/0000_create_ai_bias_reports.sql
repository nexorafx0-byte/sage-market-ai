CREATE TABLE public.ai_bias_reports (
 user_id uuid PRIMARY KEY,
 report jsonb,
 generated_at timestamptz,
 lease_until timestamptz NOT NULL DEFAULT '1970-01-01',
 paused_reason text,
 paused_status integer
);
GRANT SELECT, INSERT, UPDATE ON public.ai_bias_reports TO authenticated;
GRANT ALL ON public.ai_bias_reports TO service_role;
ALTER TABLE public.ai_bias_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own bias" ON public.ai_bias_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Insert own bias" ON public.ai_bias_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own bias" ON public.ai_bias_reports FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE FUNCTION public.claim_ai_bias() RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE claimed uuid;
BEGIN
 INSERT INTO public.ai_bias_reports(user_id) VALUES(auth.uid()) ON CONFLICT DO NOTHING;
 UPDATE public.ai_bias_reports SET lease_until = now() + interval '10 minutes' WHERE user_id = auth.uid() AND lease_until < now() RETURNING user_id INTO claimed;
 RETURN claimed IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_ai_bias() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_ai_bias() TO authenticated;
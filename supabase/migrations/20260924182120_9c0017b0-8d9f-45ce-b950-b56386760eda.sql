CREATE TABLE public.campaign_totals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_slug TEXT NOT NULL UNIQUE,
  raised_amount BIGINT NOT NULL DEFAULT 0 CHECK (raised_amount >= 0),
  goal_amount BIGINT NOT NULL CHECK (goal_amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.campaign_totals TO anon, authenticated;
GRANT ALL ON public.campaign_totals TO service_role;

ALTER TABLE public.campaign_totals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign totals are publicly readable"
ON public.campaign_totals
FOR SELECT
TO anon, authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.set_campaign_totals_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER campaign_totals_updated_at
BEFORE UPDATE ON public.campaign_totals
FOR EACH ROW
EXECUTE FUNCTION public.set_campaign_totals_updated_at();

INSERT INTO public.campaign_totals (campaign_slug, raised_amount, goal_amount, currency)
VALUES ('vox-care', 830000, 12000000, 'INR');

ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_totals;
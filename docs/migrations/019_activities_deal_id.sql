SET search_path = '';

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON public.activities (deal_id);

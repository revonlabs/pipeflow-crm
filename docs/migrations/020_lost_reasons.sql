SET search_path = '';

CREATE TABLE IF NOT EXISTS public.lost_reasons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, name)
);

ALTER TABLE public.lost_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_reasons FORCE ROW LEVEL SECURITY;

CREATE POLICY "lost_reasons_select" ON public.lost_reasons
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "lost_reasons_insert" ON public.lost_reasons
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = lost_reasons.workspace_id
        AND wm.user_id = (SELECT auth.uid())
        AND wm.role = 'admin'
    )
  );

CREATE POLICY "lost_reasons_delete" ON public.lost_reasons
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = lost_reasons.workspace_id
        AND wm.user_id = (SELECT auth.uid())
        AND wm.role = 'admin'
    )
  );

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS lost_reason_id UUID REFERENCES public.lost_reasons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deals_lost_reason_id ON public.deals (lost_reason_id);

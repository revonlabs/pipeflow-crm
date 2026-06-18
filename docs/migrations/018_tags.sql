-- Migration 018: tags livres por workspace + associação N:N com leads
-- lead_tags não tem workspace_id direto; RLS valida via join em tags.

SET search_path = '';

CREATE TABLE IF NOT EXISTS public.tags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, name)
);

CREATE TABLE IF NOT EXISTS public.lead_tags (
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (lead_id, tag_id)
);

ALTER TABLE public.tags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags      FORCE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags FORCE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_lead_tags_tag_id ON public.lead_tags (tag_id);

DROP POLICY IF EXISTS "tags_select" ON public.tags;
DROP POLICY IF EXISTS "tags_insert" ON public.tags;
DROP POLICY IF EXISTS "tags_delete" ON public.tags;

CREATE POLICY "tags_select" ON public.tags
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "tags_insert" ON public.tags
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "tags_delete" ON public.tags
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "lead_tags_select" ON public.lead_tags;
DROP POLICY IF EXISTS "lead_tags_insert" ON public.lead_tags;
DROP POLICY IF EXISTS "lead_tags_delete" ON public.lead_tags;

CREATE POLICY "lead_tags_select" ON public.lead_tags
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tags
      WHERE tags.id = lead_tags.tag_id
        AND public.is_workspace_member(tags.workspace_id)
    )
  );

CREATE POLICY "lead_tags_insert" ON public.lead_tags
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tags
      WHERE tags.id = lead_tags.tag_id
        AND public.is_workspace_member(tags.workspace_id)
    )
  );

CREATE POLICY "lead_tags_delete" ON public.lead_tags
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tags
      WHERE tags.id = lead_tags.tag_id
        AND public.is_workspace_member(tags.workspace_id)
    )
  );

-- Migration 017: tasks — follow-ups / próximo contato vinculados a uma negociação
-- Uma negociação pode ter várias tasks ao longo do tempo (histórico de follow-ups);
-- a aplicação exibe apenas a próxima pendente (completed_at IS NULL, menor due_at).

SET search_path = '';

CREATE TABLE IF NOT EXISTS public.tasks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  deal_id      UUID        NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL DEFAULT 'Próximo contato',
  due_at       TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks FORCE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tasks_deal_id ON public.tasks (deal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_due_at
  ON public.tasks (workspace_id, due_at) WHERE completed_at IS NULL;

DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;

CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "tasks_delete" ON public.tasks
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));

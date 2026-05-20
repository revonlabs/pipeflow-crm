-- Migration 007: RLS policies
-- Isolamento total por workspace_id.
-- Padrão: membro autenticado do workspace pode SELECT/INSERT/UPDATE/DELETE.
-- Subscriptions: INSERT/UPDATE apenas via service_role (webhook Stripe).
-- (SELECT auth.uid()) em vez de auth.uid() direto — evita re-eval por linha.

SET search_path = '';

-- ─── helpers ────────────────────────────────────────────────────────────────

-- Retorna true se o usuário autenticado é membro do workspace.
CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_workspace_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID) TO authenticated;

-- ─── workspaces ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "workspaces_select" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_insert" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_delete" ON public.workspaces;

CREATE POLICY "workspaces_select" ON public.workspaces
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(id));

-- INSERT é feito pela RPC create_workspace (SECURITY DEFINER), não diretamente.
CREATE POLICY "workspaces_insert" ON public.workspaces
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- Só admin pode atualizar (checado na Server Action; RLS permite qualquer membro por ora).
CREATE POLICY "workspaces_update" ON public.workspaces
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(id));

CREATE POLICY "workspaces_delete" ON public.workspaces
  FOR DELETE TO authenticated
  USING (owner_id = (SELECT auth.uid()));

-- ─── workspace_members ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "wm_select" ON public.workspace_members;
DROP POLICY IF EXISTS "wm_insert" ON public.workspace_members;
DROP POLICY IF EXISTS "wm_update" ON public.workspace_members;
DROP POLICY IF EXISTS "wm_delete" ON public.workspace_members;

CREATE POLICY "wm_select" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- Inserção feita pela RPC ou por service_role no webhook/convite.
CREATE POLICY "wm_insert" ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "wm_update" ON public.workspace_members
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "wm_delete" ON public.workspace_members
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- ─── leads ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "leads_select" ON public.leads;
DROP POLICY IF EXISTS "leads_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_update" ON public.leads;
DROP POLICY IF EXISTS "leads_delete" ON public.leads;

CREATE POLICY "leads_select" ON public.leads
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "leads_insert" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "leads_update" ON public.leads
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "leads_delete" ON public.leads
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- ─── deals ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "deals_select" ON public.deals;
DROP POLICY IF EXISTS "deals_insert" ON public.deals;
DROP POLICY IF EXISTS "deals_update" ON public.deals;
DROP POLICY IF EXISTS "deals_delete" ON public.deals;

CREATE POLICY "deals_select" ON public.deals
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "deals_insert" ON public.deals
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "deals_update" ON public.deals
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "deals_delete" ON public.deals
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- ─── activities ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "activities_select" ON public.activities;
DROP POLICY IF EXISTS "activities_insert" ON public.activities;
DROP POLICY IF EXISTS "activities_update" ON public.activities;
DROP POLICY IF EXISTS "activities_delete" ON public.activities;

CREATE POLICY "activities_select" ON public.activities
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "activities_insert" ON public.activities
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "activities_update" ON public.activities
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "activities_delete" ON public.activities
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- ─── subscriptions ───────────────────────────────────────────────────────────
-- Membros podem ler o plano do próprio workspace.
-- INSERT/UPDATE apenas via service_role (webhook Stripe — sem sessão de usuário).

DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;

CREATE POLICY "subscriptions_select" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

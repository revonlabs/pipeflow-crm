-- Migration 021: platform_admins — administração manual de workspaces de clientes
-- Pedro (Revon Labs) provisiona workspaces e convida usuários sem fluxo de
-- self-service/Stripe. is_platform_admin() segue o mesmo padrão de
-- is_workspace_member() em 007_rls_policies.sql.

SET search_path = '';

CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

-- Apenas o próprio admin pode ver sua entrada. Inserção/remoção apenas via
-- service_role (MCP/SQL Editor) — nenhuma policy de INSERT/UPDATE/DELETE aqui.
DROP POLICY IF EXISTS "platform_admins_select" ON public.platform_admins;
CREATE POLICY "platform_admins_select" ON public.platform_admins
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ─── workspaces: acesso ampliado para platform admin ────────────────────────
-- Mantém as policies existentes (workspaces_select/insert/update/delete já
-- cobrem o caso de membro comum); adicionamos policies adicionais permissivas
-- para platform admin, que se somam via OR às já existentes do mesmo comando.

DROP POLICY IF EXISTS "workspaces_platform_admin_select" ON public.workspaces;
CREATE POLICY "workspaces_platform_admin_select" ON public.workspaces
  FOR SELECT TO authenticated
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "workspaces_platform_admin_insert" ON public.workspaces;
CREATE POLICY "workspaces_platform_admin_insert" ON public.workspaces
  FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "workspaces_platform_admin_update" ON public.workspaces;
CREATE POLICY "workspaces_platform_admin_update" ON public.workspaces
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "workspaces_platform_admin_delete" ON public.workspaces;
CREATE POLICY "workspaces_platform_admin_delete" ON public.workspaces
  FOR DELETE TO authenticated
  USING (public.is_platform_admin());

-- ─── workspace_invites: platform admin convida usuários para qualquer workspace ──

DROP POLICY IF EXISTS "invites_platform_admin_insert" ON public.workspace_invites;
CREATE POLICY "invites_platform_admin_insert" ON public.workspace_invites
  FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "invites_platform_admin_select" ON public.workspace_invites;
CREATE POLICY "invites_platform_admin_select" ON public.workspace_invites
  FOR SELECT TO authenticated
  USING (public.is_platform_admin());

-- Inserir manualmente após o deploy (não versionar o user_id real):
-- insert into public.platform_admins (user_id)
-- select id from auth.users where email = 'pedro@revonlabs.com.br';

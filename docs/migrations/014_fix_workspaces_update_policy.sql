-- Fix: policy workspaces_update tinha auto-join incorreto
-- (workspace_members.workspace_id = workspace_members.id em vez de workspaces.id)
-- Resultado: a policy nunca filtrava corretamente quem podia fazer UPDATE.
-- Aplicado em produção em 2026-05-25 durante auditoria RLS pré-deploy.

DROP POLICY IF EXISTS workspaces_update ON public.workspaces;

CREATE POLICY workspaces_update ON public.workspaces
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.user_id = (SELECT auth.uid())
        AND workspace_members.role = 'admin'
    )
  );

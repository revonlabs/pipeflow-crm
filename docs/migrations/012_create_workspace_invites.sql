-- workspace_invites: convites por e-mail com token seguro e expiração
CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email         text NOT NULL,
  token         text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  role          text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  expires_at    timestamptz NOT NULL DEFAULT now() + interval '7 days',
  accepted_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites FORCE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX IF NOT EXISTS workspace_invites_workspace_id_idx ON public.workspace_invites (workspace_id);
CREATE INDEX IF NOT EXISTS workspace_invites_token_idx       ON public.workspace_invites (token);
CREATE INDEX IF NOT EXISTS workspace_invites_email_idx       ON public.workspace_invites (email);

-- RLS: membros do workspace veem os convites do seu workspace
CREATE POLICY "invites_select" ON public.workspace_invites
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_invites.workspace_id
        AND wm.user_id = (SELECT auth.uid())
    )
  );

-- RLS: apenas admin pode inserir convites
CREATE POLICY "invites_insert" ON public.workspace_invites
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_invites.workspace_id
        AND wm.user_id = (SELECT auth.uid())
        AND wm.role = 'admin'
    )
  );

-- RLS: apenas admin pode deletar/cancelar convites do seu workspace
CREATE POLICY "invites_delete" ON public.workspace_invites
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_invites.workspace_id
        AND wm.user_id = (SELECT auth.uid())
        AND wm.role = 'admin'
    )
  );

-- O accepted_at é escrito pelo service_role (admin client) na Server Action acceptInviteAction

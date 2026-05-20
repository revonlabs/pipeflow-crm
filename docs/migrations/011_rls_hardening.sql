-- Migration 011: RLS hardening — FORCE ROW LEVEL SECURITY + function security
-- FORCE RLS impede que o role 'postgres' (owner das tabelas) burle as policies
-- mesmo em conexões diretas ao banco (ex: via psql ou migrations mal escritas).
-- Ref: security-rls-basics, security-privileges

SET search_path = '';

-- ─── FORCE ROW LEVEL SECURITY em todas as tabelas ───────────────────────────
-- (RLS já estava ENABLED; FORCE garante que NENHUM role bypassa as policies)

ALTER TABLE public.workspaces        FORCE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.leads             FORCE ROW LEVEL SECURITY;
ALTER TABLE public.deals             FORCE ROW LEVEL SECURITY;
ALTER TABLE public.activities        FORCE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions     FORCE ROW LEVEL SECURITY;

-- ─── Recriar is_workspace_member com search_path hardened ───────────────────
-- search_path='' evita schema injection (alguém criar função com mesmo nome
-- em schema público que o search_path resolveria antes do 'public').
-- Ref: security-privileges

CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE          -- permite PostgreSQL cache do resultado dentro da transação
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = (SELECT auth.uid())  -- SELECT wrapper = auth.uid() chamado 1x por query, não por linha
  );
$$;

REVOKE ALL ON FUNCTION public.is_workspace_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID) TO authenticated;

-- ─── Recriar create_workspace com slug_conflict handling ────────────────────
-- Adicionamos tratamento de slug duplicado com sufixo aleatório para evitar
-- falha silenciosa que antes caía no fallback sem feedback útil.

CREATE OR REPLACE FUNCTION public.create_workspace(
  workspace_name TEXT,
  workspace_slug TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_workspace_id UUID;
  v_user_id      UUID;
  v_slug         TEXT := workspace_slug;
BEGIN
  v_user_id := (SELECT auth.uid());

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Tenta com o slug original; em caso de conflito adiciona sufixo curto
  BEGIN
    INSERT INTO public.workspaces (name, slug, owner_id)
    VALUES (workspace_name, v_slug, v_user_id)
    RETURNING id INTO v_workspace_id;
  EXCEPTION WHEN unique_violation THEN
    v_slug := v_slug || '-' || substr(md5(gen_random_uuid()::text), 1, 6);
    INSERT INTO public.workspaces (name, slug, owner_id)
    VALUES (workspace_name, v_slug, v_user_id)
    RETURNING id INTO v_workspace_id;
  END;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace_id, v_user_id, 'admin');

  RETURN v_workspace_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_workspace(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_workspace(TEXT, TEXT) TO authenticated;

-- ─── Policy workspaces_update refinada ──────────────────────────────────────
-- Antes permitia qualquer membro atualizar. Agora só admin pode.
-- (A Server Action já checava isso, mas a defesa em profundidade exige que o
--  banco também rejeite — princípio de least privilege.)

DROP POLICY IF EXISTS "workspaces_update" ON public.workspaces;

CREATE POLICY "workspaces_update" ON public.workspaces
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = id
        AND user_id = (SELECT auth.uid())
        AND role = 'admin'
    )
  );

-- ─── Policy wm_insert refinada ───────────────────────────────────────────────
-- INSERT em workspace_members (convite aceito) deve ser feito via service_role
-- no webhook ou server action — não diretamente por membros comuns.
-- Mantemos apenas a RPC como vetor de insert inicial.

DROP POLICY IF EXISTS "wm_insert" ON public.workspace_members;

-- Permite apenas ao próprio usuário inserir a si mesmo (aceitar convite)
-- ou via service_role (webhook). Admins adicionam via server action que usa anon key + RLS.
CREATE POLICY "wm_insert" ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_workspace_member(workspace_id)
  );

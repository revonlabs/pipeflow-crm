-- Migration 009: RPC create_workspace
-- Cria workspace + membro admin em uma transação atômica.
-- SECURITY DEFINER: executa com privilégios do owner da função (bypassa RLS
-- apenas para este insert inicial — necessário pois o usuário ainda não é membro).

CREATE OR REPLACE FUNCTION public.create_workspace(
  workspace_name TEXT,
  workspace_slug TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_workspace_id UUID;
  v_user_id      UUID;
BEGIN
  v_user_id := (SELECT auth.uid());

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  INSERT INTO public.workspaces (name, slug, owner_id)
  VALUES (workspace_name, workspace_slug, v_user_id)
  RETURNING id INTO v_workspace_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace_id, v_user_id, 'admin');

  RETURN v_workspace_id;
END;
$$;

-- Revoga acesso público e concede apenas a usuários autenticados.
REVOKE ALL ON FUNCTION public.create_workspace(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_workspace(TEXT, TEXT) TO authenticated;

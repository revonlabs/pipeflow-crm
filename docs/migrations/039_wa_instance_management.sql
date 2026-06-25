-- Migration 039: WhatsApp Monitor — Sprint 5.5 (Gestão de Instâncias)
-- Criar/conectar/remover instâncias 100% dentro do CRM (sem painel da Evolution).
--
-- 1. wa_instances.phone_number passa a ser NULLABLE — no momento da criação
--    (status='qr_pending') o número real só é conhecido depois que o
--    WhatsApp confirma a conexão via webhook connection.update. display_name
--    continua NOT NULL (admin digita um nome ao criar, ex: "Vendas Loja 2").
-- 2. wa_list_instances_rpc / wa_create_instance_rpc / wa_update_instance_status_rpc
--    / wa_delete_instance_rpc — mesmo padrão is_workspace_admin + SECURITY
--    DEFINER das migrations 030/038. wa_update_instance_status_rpc é chamada
--    pelo webhook handler (service_role, sem sessão de usuário) ao receber
--    connection.update — por isso não exige is_workspace_admin, apenas que
--    o caller tenha a service_role (RLS já restringe authenticated).
--
-- Idempotente: CREATE OR REPLACE / ALTER ... DROP NOT NULL (idempotente por natureza).

SET search_path = '';

-- ─── phone_number nullable ──────────────────────────────────────────────────

ALTER TABLE public.wa_instances ALTER COLUMN phone_number DROP NOT NULL;

-- ─── lista instâncias do workspace ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.wa_list_instances_rpc(
  p_workspace_id UUID
)
RETURNS TABLE (
  id UUID,
  evolution_instance_name TEXT,
  phone_number TEXT,
  display_name TEXT,
  status TEXT,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_workspace_admin(p_workspace_id) THEN
    RAISE EXCEPTION 'wa_access_denied';
  END IF;

  RETURN QUERY
  SELECT
    i.id,
    i.evolution_instance_name::TEXT,
    i.phone_number::TEXT,
    i.display_name::TEXT,
    i.status::TEXT,
    i.last_seen_at,
    i.created_at
  FROM public.wa_instances i
  WHERE i.workspace_id = p_workspace_id
  ORDER BY i.created_at DESC;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'wa_access_denied' THEN
    RAISE;
  END IF;
  RAISE EXCEPTION 'wa_query_error';
END;
$$;

REVOKE ALL ON FUNCTION public.wa_list_instances_rpc(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_list_instances_rpc(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.wa_list_instances_rpc(UUID) TO authenticated, service_role;

-- ─── cria instância (antes de chamar a Evolution API) ──────────────────────
-- evolution_instance_name é gerado pela Server Action (não aqui) — precisa
-- ser conhecido ANTES desta RPC para já chamar POST /instance/create com o
-- mesmo nome. webhook_token/webhook_secret usam os defaults da migration 022.

CREATE OR REPLACE FUNCTION public.wa_create_instance_rpc(
  p_workspace_id UUID,
  p_evolution_instance_name TEXT,
  p_display_name TEXT
)
RETURNS TABLE (
  id UUID,
  webhook_token TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id UUID;
  v_webhook_token TEXT;
BEGIN
  IF NOT public.is_workspace_admin(p_workspace_id) THEN
    RAISE EXCEPTION 'wa_access_denied';
  END IF;

  INSERT INTO public.wa_instances (
    workspace_id, evolution_instance_name, display_name, status
  ) VALUES (
    p_workspace_id, p_evolution_instance_name, p_display_name, 'qr_pending'
  )
  RETURNING wa_instances.id, wa_instances.webhook_token INTO v_id, v_webhook_token;

  RETURN QUERY SELECT v_id, v_webhook_token;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'wa_access_denied' THEN
    RAISE;
  END IF;
  RAISE EXCEPTION 'wa_create_error';
END;
$$;

REVOKE ALL ON FUNCTION public.wa_create_instance_rpc(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_create_instance_rpc(UUID, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.wa_create_instance_rpc(UUID, TEXT, TEXT) TO authenticated, service_role;

-- ─── atualiza status ao receber connection.update (chamada pelo webhook) ───
-- Sem is_workspace_admin: o webhook handler chama via service_role, sem
-- sessão de usuário (mesmo padrão de wa_webhook_queue). RLS + FORCE RLS já
-- bloqueia authenticated sem policy — apenas service_role tem GRANT aqui.

CREATE OR REPLACE FUNCTION public.wa_update_instance_status_rpc(
  p_instance_id UUID,
  p_status TEXT,
  p_phone_number TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.wa_instances
  SET status = p_status,
      phone_number = COALESCE(p_phone_number, wa_instances.phone_number),
      last_seen_at = now(),
      updated_at = now()
  WHERE wa_instances.id = p_instance_id;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'wa_update_error';
END;
$$;

REVOKE ALL ON FUNCTION public.wa_update_instance_status_rpc(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_update_instance_status_rpc(UUID, TEXT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wa_update_instance_status_rpc(UUID, TEXT, TEXT) TO service_role;

-- ─── remove instância (admin já removeu/desconectou da Evolution antes) ───

CREATE OR REPLACE FUNCTION public.wa_delete_instance_rpc(
  p_instance_id UUID,
  p_workspace_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_workspace_admin(p_workspace_id) THEN
    RAISE EXCEPTION 'wa_access_denied';
  END IF;

  DELETE FROM public.wa_instances
  WHERE wa_instances.id = p_instance_id
    AND wa_instances.workspace_id = p_workspace_id;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'wa_access_denied' THEN
    RAISE;
  END IF;
  RAISE EXCEPTION 'wa_delete_error';
END;
$$;

REVOKE ALL ON FUNCTION public.wa_delete_instance_rpc(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_delete_instance_rpc(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.wa_delete_instance_rpc(UUID, UUID) TO authenticated, service_role;

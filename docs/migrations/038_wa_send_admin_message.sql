-- Migration 038: WhatsApp Monitor — Sprint 5 (Intervenção do Admin)
-- RPCs de suporte ao envio manual de mensagem pelo admin:
--
-- 1. wa_get_conversation_send_context_rpc — dados necessários para chamar a
--    Evolution API (nome da instância + telefone do contato), com a mesma
--    validação de acesso das demais RPCs SECURITY DEFINER deste módulo.
--    Nenhuma RPC existente (030/031) expõe evolution_instance_name.
-- 2. wa_get_last_vendor_activity_rpc — última atividade humana (vendor ou
--    admin_intervention) na conversa, para a UI decidir se mostra o aviso
--    "vendedor pode estar respondendo agora" (<2min). Consulta on-demand,
--    sem coluna nova em wa_conversations (decisão consciente: granularidade
--    de poucos minutos não justifica trigger + coluna extra agora).
-- 3. wa_send_admin_message_rpc — persiste a mensagem enviada pelo admin
--    (cifrando content_text com a mesma wa_encrypt_content da migration 024)
--    e atualiza wa_conversations.last_message_at/last_message_preview.
--    Quem efetivamente chama a Evolution API é a Server Action, ANTES desta
--    RPC — esta função só persiste o resultado já confirmado, com o
--    evolution_message_id retornado pela Evolution (idempotência real, não
--    sintética).
--
-- Idempotente: CREATE OR REPLACE.

SET search_path = '';

-- ─── contexto para envio (nome da instância + telefone do contato) ────────

CREATE OR REPLACE FUNCTION public.wa_get_conversation_send_context_rpc(
  p_conversation_id UUID,
  p_workspace_id UUID
)
RETURNS TABLE (
  evolution_instance_name TEXT,
  contact_phone TEXT
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
    i.evolution_instance_name::TEXT,
    ct.phone_number::TEXT
  FROM public.wa_conversations c
  JOIN public.wa_instances i ON i.id = c.instance_id
  JOIN public.wa_contacts ct ON ct.id = c.contact_id
  WHERE c.id = p_conversation_id
    AND c.workspace_id = p_workspace_id;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'wa_access_denied' THEN
    RAISE;
  END IF;
  RAISE EXCEPTION 'wa_query_error';
END;
$$;

REVOKE ALL ON FUNCTION public.wa_get_conversation_send_context_rpc(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_get_conversation_send_context_rpc(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.wa_get_conversation_send_context_rpc(UUID, UUID) TO authenticated, service_role;

-- ─── última atividade humana na conversa (vendor ou admin_intervention) ───

CREATE OR REPLACE FUNCTION public.wa_get_last_vendor_activity_rpc(
  p_conversation_id UUID,
  p_workspace_id UUID
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_last_at TIMESTAMPTZ;
BEGIN
  IF NOT public.is_workspace_admin(p_workspace_id) THEN
    RAISE EXCEPTION 'wa_access_denied';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.wa_conversations conv
    WHERE conv.id = p_conversation_id AND conv.workspace_id = p_workspace_id
  ) THEN
    RAISE EXCEPTION 'wa_access_denied';
  END IF;

  SELECT m.timestamp_wa INTO v_last_at
  FROM public.wa_messages m
  WHERE m.conversation_id = p_conversation_id
    AND m.workspace_id = p_workspace_id
    AND m.sent_by IN ('vendor', 'admin_intervention')
  ORDER BY m.timestamp_wa DESC
  LIMIT 1;

  RETURN v_last_at;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'wa_access_denied' THEN
    RAISE;
  END IF;
  RAISE EXCEPTION 'wa_query_error';
END;
$$;

REVOKE ALL ON FUNCTION public.wa_get_last_vendor_activity_rpc(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_get_last_vendor_activity_rpc(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.wa_get_last_vendor_activity_rpc(UUID, UUID) TO authenticated, service_role;

-- ─── persiste mensagem enviada pelo admin (após sucesso na Evolution API) ─

CREATE OR REPLACE FUNCTION public.wa_send_admin_message_rpc(
  p_conversation_id UUID,
  p_workspace_id UUID,
  p_user_id UUID,
  p_content_text TEXT,
  p_evolution_message_id TEXT,
  p_master_key TEXT
)
RETURNS TABLE (
  id UUID,
  timestamp_wa TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_message_id UUID;
  v_timestamp TIMESTAMPTZ := now();
  v_ciphertext BYTEA;
  v_preview TEXT;
BEGIN
  IF NOT public.is_workspace_admin(p_workspace_id) THEN
    RAISE EXCEPTION 'wa_access_denied';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.wa_conversations conv
    WHERE conv.id = p_conversation_id AND conv.workspace_id = p_workspace_id
  ) THEN
    RAISE EXCEPTION 'wa_access_denied';
  END IF;

  v_ciphertext := public.wa_encrypt_content(p_content_text, p_workspace_id, 1, p_master_key);
  v_preview := left(p_content_text, 200);

  INSERT INTO public.wa_messages (
    workspace_id, conversation_id, evolution_message_id, direction, sent_by,
    intervention_user_id, content_type, content_text, status, timestamp_wa, key_version
  ) VALUES (
    p_workspace_id, p_conversation_id, p_evolution_message_id, 'out', 'admin_intervention',
    p_user_id, 'text', v_ciphertext, 'sent', v_timestamp, 1
  )
  RETURNING wa_messages.id INTO v_message_id;

  UPDATE public.wa_conversations
  SET last_message_at = v_timestamp,
      last_message_preview = v_preview,
      updated_at = v_timestamp
  WHERE wa_conversations.id = p_conversation_id;

  RETURN QUERY SELECT v_message_id, v_timestamp;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'wa_access_denied' THEN
    RAISE;
  END IF;
  RAISE EXCEPTION 'wa_send_error';
END;
$$;

REVOKE ALL ON FUNCTION public.wa_send_admin_message_rpc(UUID, UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_send_admin_message_rpc(UUID, UUID, UUID, TEXT, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.wa_send_admin_message_rpc(UUID, UUID, UUID, TEXT, TEXT, TEXT) TO authenticated, service_role;

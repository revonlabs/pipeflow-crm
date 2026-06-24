-- Migration 030: WhatsApp Monitor — Sprint 2 (Visualização)
-- RPCs de leitura para lista de conversas e histórico de mensagens, com
-- decrypt em lote feito dentro do Postgres (evita N round-trips de RPC de
-- decrypt por linha no client).
--
-- Nota: wa_conversations.last_message_preview NÃO é cifrado (ficou de fora
-- da migration 025 — só wa_messages.content_text/media_url e
-- wa_contacts.profile_pic_url são bytea). wa_list_conversations_rpc lê essa
-- coluna direto, sem decrypt.
--
-- Estas funções são SECURITY DEFINER (a de mensagens precisa chamar
-- wa_decrypt_content, que é interna e sem GRANT para authenticated — ver
-- 024). Diferente das tabelas base, SECURITY DEFINER NÃO passa pela RLS de
-- wa_conversations/wa_messages automaticamente: por isso cada função abaixo
-- valida is_workspace_admin(p_workspace_id) explicitamente, no início, antes
-- de tocar em qualquer linha. Sem essa checagem, qualquer authenticated com
-- o workspace_id de outro tenant poderia ler conversas que não são dele.
--
-- Idempotente: CREATE OR REPLACE.

SET search_path = '';

-- ─── lista de conversas (paginada) ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.wa_list_conversations_rpc(
  p_workspace_id UUID,
  p_instance_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  instance_id UUID,
  contact_id UUID,
  contact_name TEXT,
  contact_phone TEXT,
  status TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count INTEGER
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
    c.id,
    c.instance_id,
    c.contact_id,
    ct.display_name::TEXT,
    ct.phone_number::TEXT,
    c.status::TEXT,
    c.last_message_at,
    c.last_message_preview::TEXT,
    c.unread_count
  FROM public.wa_conversations c
  JOIN public.wa_contacts ct ON ct.id = c.contact_id
  WHERE c.workspace_id = p_workspace_id
    AND (p_instance_id IS NULL OR c.instance_id = p_instance_id)
    AND (p_status IS NULL OR c.status = p_status)
    AND (
      p_search IS NULL
      OR ct.display_name ILIKE '%' || p_search || '%'
      OR ct.phone_number ILIKE '%' || p_search || '%'
    )
  ORDER BY c.last_message_at DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'wa_access_denied' THEN
    RAISE;
  END IF;
  RAISE EXCEPTION 'wa_query_error';
END;
$$;

REVOKE ALL ON FUNCTION public.wa_list_conversations_rpc(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_list_conversations_rpc(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.wa_list_conversations_rpc(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER) TO authenticated, service_role;

-- ─── histórico de mensagens de uma conversa (cursor por timestamp_wa) ──────

CREATE OR REPLACE FUNCTION public.wa_get_conversation_messages_rpc(
  p_conversation_id UUID,
  p_workspace_id UUID,
  p_master_key TEXT,
  p_before TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  direction TEXT,
  sent_by TEXT,
  content_type TEXT,
  content_text TEXT,
  media_url TEXT,
  media_mime TEXT,
  status TEXT,
  timestamp_wa TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_workspace_admin(p_workspace_id) THEN
    RAISE EXCEPTION 'wa_access_denied';
  END IF;

  -- Confirma que a conversa pertence ao workspace informado antes de
  -- retornar qualquer mensagem — defesa em profundidade, já que esta função
  -- é SECURITY DEFINER e não passa pela RLS de wa_conversations.
  IF NOT EXISTS (
    SELECT 1 FROM public.wa_conversations conv
    WHERE conv.id = p_conversation_id AND conv.workspace_id = p_workspace_id
  ) THEN
    RAISE EXCEPTION 'wa_access_denied';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.direction::TEXT,
    m.sent_by::TEXT,
    m.content_type::TEXT,
    public.wa_decrypt_content(m.content_text, p_workspace_id, m.key_version, p_master_key),
    public.wa_decrypt_content(m.media_url, p_workspace_id, m.key_version, p_master_key),
    m.media_mime::TEXT,
    m.status::TEXT,
    m.timestamp_wa
  FROM public.wa_messages m
  WHERE m.conversation_id = p_conversation_id
    AND m.workspace_id = p_workspace_id
    AND (p_before IS NULL OR m.timestamp_wa < p_before)
  ORDER BY m.timestamp_wa DESC
  LIMIT p_limit;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'wa_access_denied' THEN
    RAISE;
  END IF;
  RAISE EXCEPTION 'wa_query_error';
END;
$$;

REVOKE ALL ON FUNCTION public.wa_get_conversation_messages_rpc(UUID, UUID, TEXT, TIMESTAMPTZ, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_get_conversation_messages_rpc(UUID, UUID, TEXT, TIMESTAMPTZ, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.wa_get_conversation_messages_rpc(UUID, UUID, TEXT, TIMESTAMPTZ, INTEGER) TO authenticated, service_role;

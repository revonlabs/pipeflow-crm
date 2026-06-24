-- Migration 031: WhatsApp Monitor — Sprint 3 (Tempo Real)
--
-- Spec original (§7) descreve Socket.io com rooms por workspace. O CRM real
-- é Next.js + Supabase sem processo Node persistente, então adaptamos para
-- Supabase Realtime (postgres_changes), seguindo a mesma convenção dos
-- sprints anteriores (Server Components/Actions em vez de REST custom).
--
-- Supabase Realtime respeita RLS automaticamente (desde Realtime 2.x) quando
-- o client usa a sessão autenticada — por isso wa_messages/wa_conversations
-- já protegidas por is_workspace_admin (023) não precisam de filtro
-- adicional no client além de WHERE workspace_id/conversation_id.
--
-- Regra crítica (mesma do spec §7.2): payload do Realtime de wa_messages NÃO
-- pode conter content_text/media_url cifrados sem decrypt. O client recebe
-- só o id da mensagem nova via evento e busca o conteúdo decifrado via
-- wa_get_message_rpc (nova, abaixo) — análogo ao padrão já usado em
-- wa_get_conversation_messages_rpc (030).
--
-- wa_conversations.last_message_preview não é cifrado (ver nota em 030), por
-- isso o evento de UPDATE/INSERT nessa tabela pode ser consumido direto do
-- payload do Realtime, sem RPC adicional.

SET search_path = '';

-- ─── habilita Realtime nas tabelas necessárias ──────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.wa_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wa_conversations;

-- ─── decrypt de uma única mensagem (evento de Realtime) ────────────────────

CREATE OR REPLACE FUNCTION public.wa_get_message_rpc(
  p_message_id UUID,
  p_workspace_id UUID,
  p_master_key TEXT
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
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

  RETURN QUERY
  SELECT
    m.id,
    m.conversation_id,
    m.direction::TEXT,
    m.sent_by::TEXT,
    m.content_type::TEXT,
    public.wa_decrypt_content(m.content_text, p_workspace_id, m.key_version, p_master_key),
    public.wa_decrypt_content(m.media_url, p_workspace_id, m.key_version, p_master_key),
    m.media_mime::TEXT,
    m.status::TEXT,
    m.timestamp_wa
  FROM public.wa_messages m
  WHERE m.id = p_message_id
    AND m.workspace_id = p_workspace_id;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'wa_access_denied' THEN
    RAISE;
  END IF;
  RAISE EXCEPTION 'wa_query_error';
END;
$$;

REVOKE ALL ON FUNCTION public.wa_get_message_rpc(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_get_message_rpc(UUID, UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.wa_get_message_rpc(UUID, UUID, TEXT) TO authenticated, service_role;

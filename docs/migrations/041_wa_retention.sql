-- Migration 041: WhatsApp Monitor — Sprint 6 (Retenção e Polish, parte 1)
--
-- Entrega o que falta para o módulo WA não crescer sem controle e para
-- atender ao direito ao esquecimento (LGPD), conforme wa-monitor-spec.md §10:
--
-- 1. wa_messages_archive — tabela particionada por mês (timestamp_wa), mesma
--    estrutura de wa_messages (LIKE ... INCLUDING ALL, herda os tipos BYTEA
--    cifrados e key_version da migration 025). Recebe mensagens > 90 dias.
-- 2. wa_archive_old_messages() — SECURITY DEFINER, service_role only (worker
--    mensal). Cria a partição do mês de destino EM RUNTIME (não só a inicial
--    desta migration) via EXECUTE format(...), depois INSERT + DELETE na
--    mesma transação. Isso garante que o job funcione sozinho mês após mês.
-- 3. wa_messages.media_expired — flag para a Entrega 2 (limpeza de mídia
--    física > 30 dias). A deleção do arquivo no Storage só é possível via
--    Supabase Storage API, portanto fica no worker route (não aqui); esta
--    migration só adiciona a coluna e a function que MARCA o flag em lote.
-- 4. wa_anonymize_contact_rpc — client-callable (authenticated), valida
--    is_workspace_admin. Zera dados pessoais do contato (LGPD, spec §2).
-- 5. wa_purge_anonymized_contacts() — SECURITY DEFINER, service_role only.
--    Apenas IDENTIFICA mensagens com mídia ainda não limpa de contatos
--    anonimizados há > 30 dias e retorna os paths — NÃO deleta nada em SQL.
--    A deleção física fica exclusivamente no worker route (Entrega 4/042),
--    que chama deleteWaMedia() e só então marca media_expired via RPC.
--
-- Idempotente: CREATE ... IF NOT EXISTS / CREATE OR REPLACE em tudo.

SET search_path = '';

-- ============================================================================
-- wa_messages.media_expired — flag de limpeza física de mídia (Entrega 2)
-- ============================================================================

ALTER TABLE public.wa_messages
  ADD COLUMN IF NOT EXISTS media_expired BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.wa_messages.media_expired IS
  'true quando o arquivo físico no Storage já foi deletado pelo worker de retenção (mídia > 30 dias). O worker é quem deleta; esta coluna só registra o estado.';

CREATE INDEX IF NOT EXISTS idx_wa_messages_media_cleanup
  ON public.wa_messages (received_at)
  WHERE media_url IS NOT NULL AND media_expired = FALSE;

-- ============================================================================
-- wa_messages_archive — partição por mês (timestamp_wa), mensagens > 90 dias
-- ============================================================================

-- INCLUDING ALL traria a PRIMARY KEY (id) e o UNIQUE (evolution_message_id)
-- de wa_messages, mas Postgres exige que toda constraint única numa tabela
-- particionada inclua a coluna de partição (timestamp_wa). Por isso aqui é
-- só INCLUDING DEFAULTS (sem índices/constraints herdados); a PK composta
-- (id, timestamp_wa) e um índice simples (não-único) em evolution_message_id
-- são recriados manualmente a seguir.
CREATE TABLE IF NOT EXISTS public.wa_messages_archive (
  LIKE public.wa_messages INCLUDING DEFAULTS,
  PRIMARY KEY (id, timestamp_wa)
) PARTITION BY RANGE (timestamp_wa);

CREATE INDEX IF NOT EXISTS idx_wa_messages_archive_evolution_message_id
  ON public.wa_messages_archive (evolution_message_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_archive_conv
  ON public.wa_messages_archive (conversation_id, timestamp_wa DESC);
CREATE INDEX IF NOT EXISTS idx_wa_messages_archive_workspace_time
  ON public.wa_messages_archive (workspace_id, received_at DESC);

ALTER TABLE public.wa_messages_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_messages_archive FORCE ROW LEVEL SECURITY;

-- Partição do mês corrente, só para a tabela já existir com ao menos uma
-- partição no deploy inicial. Partições dos meses seguintes são criadas
-- dinamicamente por wa_archive_old_messages() — não dependem de nova migration.
-- Partições filhas NÃO herdam ENABLE/FORCE ROW LEVEL SECURITY da tabela
-- particionada-mãe automaticamente — precisa habilitar em cada partição,
-- aqui e dentro de wa_archive_old_messages() para as partições futuras.
DO $$
DECLARE
  v_start DATE := date_trunc('month', now())::date;
  v_end   DATE := (date_trunc('month', now()) + interval '1 month')::date;
  v_name  TEXT := format('wa_messages_archive_%s', to_char(v_start, 'YYYY_MM'));
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.wa_messages_archive FOR VALUES FROM (%L) TO (%L)',
    v_name, v_start, v_end
  );
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_name);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', v_name);
END $$;

-- Mesma policy de wa_messages: admin do workspace pode ler o histórico
-- arquivado. Sem INSERT/UPDATE/DELETE para authenticated — só o worker
-- (service_role, via wa_archive_old_messages) escreve aqui.
DROP POLICY IF EXISTS "wa_messages_archive_select" ON public.wa_messages_archive;

CREATE POLICY "wa_messages_archive_select" ON public.wa_messages_archive
  FOR SELECT TO authenticated
  USING (public.is_workspace_admin(workspace_id));

-- ─── arquivamento (worker, service_role only) ──────────────────────────────

CREATE OR REPLACE FUNCTION public.wa_archive_old_messages()
RETURNS TABLE (archived_count BIGINT)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cutoff TIMESTAMPTZ := now() - interval '90 days';
  v_rec    RECORD;
  v_count  BIGINT := 0;
BEGIN
  -- Cria, em runtime, a partição de cada mês-calendário presente nas
  -- mensagens elegíveis para arquivamento, antes do INSERT.
  FOR v_rec IN
    SELECT DISTINCT date_trunc('month', timestamp_wa) AS month_start
    FROM public.wa_messages
    WHERE timestamp_wa < v_cutoff
  LOOP
    DECLARE
      v_partition_name TEXT := format('wa_messages_archive_%s', to_char(v_rec.month_start, 'YYYY_MM'));
    BEGIN
      EXECUTE format(
        'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.wa_messages_archive FOR VALUES FROM (%L) TO (%L)',
        v_partition_name, v_rec.month_start, v_rec.month_start + interval '1 month'
      );
      -- Partição filha não herda RLS da tabela-mãe automaticamente.
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_partition_name);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', v_partition_name);
    END;
  END LOOP;

  WITH moved AS (
    DELETE FROM public.wa_messages
    WHERE timestamp_wa < v_cutoff
    RETURNING *
  )
  INSERT INTO public.wa_messages_archive
  SELECT * FROM moved;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN QUERY SELECT v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.wa_archive_old_messages() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_archive_old_messages() FROM authenticated, anon;
GRANT EXECUTE ON FUNCTION public.wa_archive_old_messages() TO service_role;

-- ─── seleção de mídia expirável (worker, service_role only) ────────────────
-- Mensagens com mídia, received_at > 30 dias, ainda não limpas. Mesmo padrão
-- de retorno de wa_purge_anonymized_contacts (workspace_id/key_version para
-- o worker descriptografar o path antes de chamar deleteWaMedia()).

CREATE OR REPLACE FUNCTION public.wa_select_expirable_media(p_limit INTEGER DEFAULT 200)
RETURNS TABLE (message_id UUID, workspace_id UUID, key_version INTEGER, media_url BYTEA)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT m.id, m.workspace_id, m.key_version, m.media_url
  FROM public.wa_messages m
  WHERE m.media_url IS NOT NULL
    AND m.media_expired = FALSE
    AND m.received_at < now() - interval '30 days'
  ORDER BY m.received_at ASC
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION public.wa_select_expirable_media(INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_select_expirable_media(INTEGER) FROM authenticated, anon;
GRANT EXECUTE ON FUNCTION public.wa_select_expirable_media(INTEGER) TO service_role;

-- ─── marcação de mídia expirada (worker, service_role only) ────────────────
-- O worker já deletou o arquivo físico via Storage API antes de chamar isto;
-- esta function só registra o estado em lote, pelos IDs informados.

CREATE OR REPLACE FUNCTION public.wa_mark_media_expired(p_message_ids UUID[])
RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.wa_messages
  SET media_expired = TRUE
  WHERE id = ANY (p_message_ids);
$$;

REVOKE ALL ON FUNCTION public.wa_mark_media_expired(UUID[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_mark_media_expired(UUID[]) FROM authenticated, anon;
GRANT EXECUTE ON FUNCTION public.wa_mark_media_expired(UUID[]) TO service_role;

-- ─── anonimização LGPD (client-callable, authenticated) ────────────────────

CREATE OR REPLACE FUNCTION public.wa_anonymize_contact_rpc(
  p_contact_id UUID,
  p_workspace_id UUID
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_workspace_admin(p_workspace_id) THEN
    RAISE EXCEPTION 'wa_access_denied';
  END IF;

  UPDATE public.wa_contacts
  SET display_name    = '[Anonimizado]',
      profile_pic_url = NULL,
      phone_number    = '[redacted]',
      anonymized_at   = now(),
      updated_at      = now()
  WHERE id = p_contact_id
    AND workspace_id = p_workspace_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'wa_contact_not_found';
  END IF;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM IN ('wa_access_denied', 'wa_contact_not_found') THEN
    RAISE;
  END IF;
  RAISE EXCEPTION 'wa_query_error';
END;
$$;

REVOKE ALL ON FUNCTION public.wa_anonymize_contact_rpc(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_anonymize_contact_rpc(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.wa_anonymize_contact_rpc(UUID, UUID) TO authenticated, service_role;

-- ─── identificação de mídia a purgar (worker, service_role only) ──────────
-- Só identifica e retorna; não deleta nada. O worker route chama
-- deleteWaMedia() para cada path retornado e só então usa
-- wa_mark_media_expired() para registrar o resultado.

-- Retorna media_url ainda cifrado (BYTEA) + workspace_id/key_version, para o
-- worker descriptografar via decryptWaContent() (mesmo padrão de crypto.ts)
-- antes de chamar deleteWaMedia() com o path em texto plano.
CREATE OR REPLACE FUNCTION public.wa_purge_anonymized_contacts(p_limit INTEGER DEFAULT 200)
RETURNS TABLE (message_id UUID, workspace_id UUID, key_version INTEGER, media_url BYTEA)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT m.id, m.workspace_id, m.key_version, m.media_url
  FROM public.wa_messages m
  JOIN public.wa_conversations c ON c.id = m.conversation_id
  JOIN public.wa_contacts ct ON ct.id = c.contact_id
  WHERE ct.anonymized_at IS NOT NULL
    AND ct.anonymized_at < now() - interval '30 days'
    AND m.media_url IS NOT NULL
    AND m.media_expired = FALSE
  ORDER BY m.received_at ASC
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION public.wa_purge_anonymized_contacts(INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_purge_anonymized_contacts(INTEGER) FROM authenticated, anon;
GRANT EXECUTE ON FUNCTION public.wa_purge_anonymized_contacts(INTEGER) TO service_role;

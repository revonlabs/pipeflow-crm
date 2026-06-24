-- Migration 032: WhatsApp Monitor — Sprint 4 (Métricas, parte 1: agregação)
--
-- A tabela wa_response_metrics e sua policy de SELECT já existem desde as
-- migrations 022/023 (Sprint 0), schema vindo de wa-monitor-spec.md §4.1 — só
-- nunca tinham sido populadas. Esta migration adiciona:
--
-- 1. wa_aggregate_metrics(p_date) — agregação SECURITY DEFINER, chamada só
--    pelo worker via service_role (nunca pelo client autenticado). Roda para
--    TODOS os workspaces/instâncias de uma vez (cron horário), por isso não
--    valida is_workspace_admin — não há p_workspace_id de entrada.
-- 2. wa_get_metrics_overview_rpc(p_workspace_id, p_from, p_to) — leitura
--    paginada por período para o dashboard, client-callable, mesmo padrão de
--    is_workspace_admin das RPCs de 030.
--
-- Idempotente: CREATE OR REPLACE.

SET search_path = '';

-- ─── agregação (worker, service_role only) ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.wa_aggregate_metrics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.wa_response_metrics (
    workspace_id, instance_id, date,
    total_in, total_out, unique_contacts, conversations_started,
    conversations_unanswered_1h, avg_first_response_seconds,
    avg_response_seconds, peak_hour, updated_at
  )
  SELECT
    m.workspace_id,
    m.instance_id,
    p_date,
    COUNT(*) FILTER (WHERE m.direction = 'in') AS total_in,
    COUNT(*) FILTER (WHERE m.direction = 'out') AS total_out,
    COUNT(DISTINCT c.contact_id) AS unique_contacts,
    COUNT(DISTINCT c.id) FILTER (WHERE c.created_at::date = p_date) AS conversations_started,
    COUNT(DISTINCT c.id) FILTER (
      WHERE c.first_response_at IS NULL
        AND c.last_message_at < now() - interval '1 hour'
    ) AS conversations_unanswered_1h,
    EXTRACT(EPOCH FROM (
      AVG(c.first_response_at - c.created_at)
        FILTER (WHERE c.first_response_at IS NOT NULL AND c.created_at::date = p_date)
    ))::INTEGER AS avg_first_response_seconds,
    NULL::INTEGER AS avg_response_seconds, -- exige tracking por-mensagem de tempo de resposta; fora do escopo do Sprint 4
    MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM m.timestamp_wa)) AS peak_hour,
    now()
  FROM public.wa_messages m
  JOIN public.wa_conversations c ON c.id = m.conversation_id
  WHERE m.timestamp_wa::date = p_date
  GROUP BY m.workspace_id, m.instance_id
  ON CONFLICT (workspace_id, instance_id, date) DO UPDATE SET
    total_in = EXCLUDED.total_in,
    total_out = EXCLUDED.total_out,
    unique_contacts = EXCLUDED.unique_contacts,
    conversations_started = EXCLUDED.conversations_started,
    conversations_unanswered_1h = EXCLUDED.conversations_unanswered_1h,
    avg_first_response_seconds = EXCLUDED.avg_first_response_seconds,
    avg_response_seconds = EXCLUDED.avg_response_seconds,
    peak_hour = EXCLUDED.peak_hour,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.wa_aggregate_metrics(DATE) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_aggregate_metrics(DATE) FROM authenticated, anon;
GRANT EXECUTE ON FUNCTION public.wa_aggregate_metrics(DATE) TO service_role;

-- ─── leitura para o dashboard (client-callable) ────────────────────────────

CREATE OR REPLACE FUNCTION public.wa_get_metrics_overview_rpc(
  p_workspace_id UUID,
  p_from DATE,
  p_to DATE
)
RETURNS TABLE (
  date DATE,
  instance_id UUID,
  total_in INTEGER,
  total_out INTEGER,
  unique_contacts INTEGER,
  conversations_started INTEGER,
  conversations_unanswered_1h INTEGER,
  avg_first_response_seconds INTEGER,
  avg_response_seconds INTEGER,
  peak_hour INTEGER
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
    rm.date,
    rm.instance_id,
    rm.total_in,
    rm.total_out,
    rm.unique_contacts,
    rm.conversations_started,
    rm.conversations_unanswered_1h,
    rm.avg_first_response_seconds,
    rm.avg_response_seconds,
    rm.peak_hour
  FROM public.wa_response_metrics rm
  WHERE rm.workspace_id = p_workspace_id
    AND rm.date BETWEEN p_from AND p_to
  ORDER BY rm.date ASC;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'wa_access_denied' THEN
    RAISE;
  END IF;
  RAISE EXCEPTION 'wa_query_error';
END;
$$;

REVOKE ALL ON FUNCTION public.wa_get_metrics_overview_rpc(UUID, DATE, DATE) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_get_metrics_overview_rpc(UUID, DATE, DATE) FROM anon;
GRANT EXECUTE ON FUNCTION public.wa_get_metrics_overview_rpc(UUID, DATE, DATE) TO authenticated, service_role;

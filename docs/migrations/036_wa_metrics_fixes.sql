-- Migration 036: WhatsApp Monitor — Sprint 4 fixes (revisão pós-implementação, parte 2)
--
-- Corrige dois achados de qualidade do Sprint 4:
--
-- 1. peak_hour misturava mensagens 'in' e 'out' no MODE() — uma instância que
--    responde automaticamente em volume alto podia dominar a moda, fazendo a
--    coluna (cujo nome sugere "horário de pico de atividade do cliente")
--    refletir na verdade o horário em que a própria instância mais responde.
--    Corrigido filtrando MODE() só por mensagens 'in'.
--
-- 2. wa_get_metrics_overview_rpc retornava uma linha por (date, instance_id),
--    forçando o caller (getMetricsOverviewAction) a re-agregar por data em
--    JS com um Map. Corrigido somando direto por data dentro da RPC — o
--    caller agora só faz o mapeamento snake_case → camelCase, sem reduzir.
--
-- Idempotente: CREATE OR REPLACE.

SET search_path = '';

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
    NULL::INTEGER AS avg_response_seconds,
    MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM m.timestamp_wa))
      FILTER (WHERE m.direction = 'in') AS peak_hour,
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

CREATE OR REPLACE FUNCTION public.wa_get_metrics_overview_rpc(
  p_workspace_id UUID,
  p_from DATE,
  p_to DATE
)
RETURNS TABLE (
  date DATE,
  total_in BIGINT,
  total_out BIGINT,
  unique_contacts BIGINT,
  conversations_started BIGINT,
  conversations_unanswered_1h BIGINT,
  avg_first_response_seconds INTEGER
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
    SUM(rm.total_in) AS total_in,
    SUM(rm.total_out) AS total_out,
    SUM(rm.unique_contacts) AS unique_contacts,
    SUM(rm.conversations_started) AS conversations_started,
    SUM(rm.conversations_unanswered_1h) AS conversations_unanswered_1h,
    -- Média ponderada por número de conversas com primeira resposta em cada
    -- instância, não média simples entre instâncias (instância com 1
    -- conversa não deve pesar igual a uma com 50).
    CASE
      WHEN SUM(rm.conversations_started) > 0 THEN
        (SUM(rm.avg_first_response_seconds * rm.conversations_started) / SUM(rm.conversations_started))::INTEGER
      ELSE NULL
    END AS avg_first_response_seconds
  FROM public.wa_response_metrics rm
  WHERE rm.workspace_id = p_workspace_id
    AND rm.date BETWEEN p_from AND p_to
  GROUP BY rm.date
  ORDER BY rm.date ASC;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'wa_access_denied' THEN
    RAISE;
  END IF;
  RAISE EXCEPTION 'wa_query_error';
END;
$$;

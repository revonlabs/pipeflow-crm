-- Migration 037: WhatsApp Monitor — fix de bug real em produção (wa_aggregate_metrics)
--
-- Erro encontrado ao validar manualmente a rota /api/wa/worker/aggregate-metrics
-- em produção, antes de aplicar o cron (034): "column m.instance_id does not exist".
-- wa_messages não tem coluna instance_id (só wa_conversations e
-- wa_webhook_queue têm, ver 022) — a query agrupava/selecionava
-- m.workspace_id, m.instance_id quando deveria usar c.instance_id (a
-- conversa, já joinada). GROUP BY também precisa trocar de m.instance_id
-- para c.instance_id.
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
    c.instance_id,
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
  GROUP BY m.workspace_id, c.instance_id
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

-- Migration 033: WhatsApp Monitor — Sprint 4 (Métricas, parte 2: resumo diário configurável)
--
-- Resumo diário não usa horário fixo (18h, como o spec original §8.2 sugeria):
-- cada workspace escolhe schedule_time + period_hours pela própria UI do
-- módulo. O envio efetivo é feito por uma varredura periódica (cron a cada
-- 15min, migration 034) que chama wa_due_digest_workspaces — por isso não há
-- "um cron job por workspace", e a granularidade de entrega é de até 15min
-- do horário escolhido.
--
-- Idempotente: CREATE TABLE IF NOT EXISTS / CREATE OR REPLACE.

SET search_path = '';

-- ============================================================================
-- wa_digest_config
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wa_digest_config (
  workspace_id   UUID PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  schedule_time  TIME NOT NULL DEFAULT '18:00',
  period_hours   INTEGER NOT NULL DEFAULT 24,
  enabled        BOOLEAN NOT NULL DEFAULT false,
  last_sent_at   TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT wa_digest_config_period_valid CHECK (period_hours IN (24, 48, 168))
);

ALTER TABLE public.wa_digest_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_digest_config FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wa_digest_config_select" ON public.wa_digest_config;
CREATE POLICY "wa_digest_config_select" ON public.wa_digest_config
  FOR SELECT TO authenticated
  USING (public.is_workspace_admin(workspace_id));

-- Sem policy de INSERT/UPDATE/DELETE para authenticated: a escrita do client
-- passa só pelas RPCs abaixo (SECURITY DEFINER), nunca por UPDATE direto na
-- tabela — garante que last_sent_at não pode ser adulterado pelo painel.

-- ─── leitura/escrita pelo admin (client-callable) ──────────────────────────

CREATE OR REPLACE FUNCTION public.wa_get_digest_config_rpc(p_workspace_id UUID)
RETURNS TABLE (
  schedule_time TIME,
  period_hours INTEGER,
  enabled BOOLEAN,
  last_sent_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_workspace_admin(p_workspace_id) THEN
    RAISE EXCEPTION 'wa_access_denied';
  END IF;

  RETURN QUERY
  SELECT dc.schedule_time, dc.period_hours, dc.enabled, dc.last_sent_at
  FROM public.wa_digest_config dc
  WHERE dc.workspace_id = p_workspace_id;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'wa_access_denied' THEN
    RAISE;
  END IF;
  RAISE EXCEPTION 'wa_query_error';
END;
$$;

REVOKE ALL ON FUNCTION public.wa_get_digest_config_rpc(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_get_digest_config_rpc(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.wa_get_digest_config_rpc(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.wa_upsert_digest_config_rpc(
  p_workspace_id UUID,
  p_schedule_time TIME,
  p_period_hours INTEGER,
  p_enabled BOOLEAN
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_workspace_admin(p_workspace_id) THEN
    RAISE EXCEPTION 'wa_access_denied';
  END IF;

  IF p_period_hours NOT IN (24, 48, 168) THEN
    RAISE EXCEPTION 'wa_invalid_period';
  END IF;

  INSERT INTO public.wa_digest_config (workspace_id, schedule_time, period_hours, enabled, updated_at)
  VALUES (p_workspace_id, p_schedule_time, p_period_hours, p_enabled, now())
  ON CONFLICT (workspace_id) DO UPDATE SET
    schedule_time = EXCLUDED.schedule_time,
    period_hours = EXCLUDED.period_hours,
    enabled = EXCLUDED.enabled,
    updated_at = now();
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM IN ('wa_access_denied', 'wa_invalid_period') THEN
    RAISE;
  END IF;
  RAISE EXCEPTION 'wa_query_error';
END;
$$;

REVOKE ALL ON FUNCTION public.wa_upsert_digest_config_rpc(UUID, TIME, INTEGER, BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_upsert_digest_config_rpc(UUID, TIME, INTEGER, BOOLEAN) FROM anon;
GRANT EXECUTE ON FUNCTION public.wa_upsert_digest_config_rpc(UUID, TIME, INTEGER, BOOLEAN) TO authenticated, service_role;

-- ─── varredura do worker (service_role only) ───────────────────────────────

-- Retorna workspaces "devidos" na janela [p_window_start, p_window_end) cuja
-- schedule_time cai dentro dela e que ainda não receberam o resumo hoje
-- (last_sent_at::date < CURRENT_DATE ou nunca enviado). Sem is_workspace_admin
-- pois não há sessão de usuário no worker — só service_role chama isto.
CREATE OR REPLACE FUNCTION public.wa_due_digest_workspaces(
  p_window_start TIME,
  p_window_end TIME
)
RETURNS TABLE (
  workspace_id UUID,
  period_hours INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT dc.workspace_id, dc.period_hours
  FROM public.wa_digest_config dc
  WHERE dc.enabled = true
    AND dc.schedule_time >= p_window_start
    AND dc.schedule_time < p_window_end
    AND (dc.last_sent_at IS NULL OR dc.last_sent_at::date < CURRENT_DATE);
END;
$$;

REVOKE ALL ON FUNCTION public.wa_due_digest_workspaces(TIME, TIME) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_due_digest_workspaces(TIME, TIME) FROM authenticated, anon;
GRANT EXECUTE ON FUNCTION public.wa_due_digest_workspaces(TIME, TIME) TO service_role;

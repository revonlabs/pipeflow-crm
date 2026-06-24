-- Migration 035: WhatsApp Monitor — Sprint 4 fixes (revisão pós-implementação)
--
-- Corrige dois bugs reais encontrados na autorrevisão do Sprint 4:
--
-- 1. wa_due_digest_workspaces não tratava virada de meia-noite. A janela de
--    15min do worker (send-digests/route.ts) para o último slot do dia produz
--    p_window_start='23:45:00', p_window_end='00:00:00' — como TIME não tem
--    valor menor que '00:00:00', a condição "schedule_time < p_window_end"
--    nunca era satisfeita nesse slot, e workspaces configurados entre 23:45 e
--    23:59 nunca recebiam o resumo. Corrigido tratando o caso
--    p_window_end <= p_window_start como wraparound (janela cruza a meia-noite).
--
-- 2. Risco de double-send: se o e-mail era enviado com sucesso mas o UPDATE de
--    last_sent_at falhasse depois (rede, etc.), o worker lançava erro e a
--    próxima varredura (15min depois) reencontrava o mesmo workspace como
--    "devido", reenviando o resumo. Corrigido com wa_claim_digest_send: marca
--    last_sent_at ANTES de enviar o e-mail, de forma atômica (UPDATE ...
--    WHERE ... RETURNING), garantindo que apenas uma chamada concorrente
--    "ganha" o direito de enviar. Se o envio do e-mail falhar depois de
--    reivindicado, o workspace só tenta de novo no dia seguinte (mesmo
--    trade-off que qualquer falha tardia em sistemas at-most-once por dia;
--    aceito porque o pior caso é "perder um resumo", não "duplicar").
--
-- Idempotente: CREATE OR REPLACE.

SET search_path = '';

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
    AND (
      -- janela normal (não cruza a meia-noite): start <= schedule < end
      (p_window_end > p_window_start
        AND dc.schedule_time >= p_window_start
        AND dc.schedule_time < p_window_end)
      OR
      -- janela cruza a meia-noite (ex: 23:45 → 00:00): schedule >= start OU schedule < end
      (p_window_end <= p_window_start
        AND (dc.schedule_time >= p_window_start OR dc.schedule_time < p_window_end))
    )
    AND (dc.last_sent_at IS NULL OR dc.last_sent_at::date < CURRENT_DATE);
END;
$$;

-- ─── reivindicação atômica do envio (evita double-send) ────────────────────

-- Marca last_sent_at ANTES do e-mail ser enviado. Retorna true só se esta
-- chamada "ganhou" a reivindicação (linha ainda não tinha sido marcada hoje)
-- — uma segunda varredura concorrente ou um retry não reenvia.
CREATE OR REPLACE FUNCTION public.wa_claim_digest_send(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_claimed BOOLEAN;
BEGIN
  UPDATE public.wa_digest_config
  SET last_sent_at = now()
  WHERE workspace_id = p_workspace_id
    AND enabled = true
    AND (last_sent_at IS NULL OR last_sent_at::date < CURRENT_DATE);

  v_claimed := FOUND;
  RETURN v_claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.wa_claim_digest_send(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_claim_digest_send(UUID) FROM authenticated, anon;
GRANT EXECUTE ON FUNCTION public.wa_claim_digest_send(UUID) TO service_role;

-- Migration 029: WhatsApp Monitor — corrige perda de itens travados em 'processing'
--
-- Bug real encontrado em teste de escala (1000 itens, worker matado no meio
-- do processamento duas vezes): se o worker morre entre marcar um item como
-- 'processing' (wa_dequeue_webhook_items) e concluir (UPDATE pra 'done'/
-- 'failed'/'dead' no Route Handler), o item ficava 'processing' pra sempre —
-- a função antiga só selecionava status IN ('pending', 'failed'). Critério
-- de aceite do Sprint 1 exige zero perda ao matar/religar o worker.
--
-- Correção: 'processing' também é elegível pro dequeue se passou de um
-- timeout (2min — generoso pro processamento normal, incluindo upload de
-- mídia). next_attempt_at é reusado como marcador de "processing expira em":
-- setado para now() + 2min no momento do dequeue (não só na falha), então um
-- item travado se torna elegível de novo automaticamente após 2min sem que
-- ninguém precise intervir manualmente ou rodar um job de limpeza separado.
--
-- Validado: teste de escala com 1000 itens (950 únicos + 50 duplicados de
-- propósito), servidor morto no meio do processamento duas vezes (14 e 16
-- itens travados em 'processing' nas duas vezes) — ambos os lotes foram
-- resgatados e processados corretamente após esta correção. Resultado final:
-- 1000/1000 itens 'done', 950 mensagens únicas em wa_messages (50 duplicatas
-- descartadas via UNIQUE em evolution_message_id + conflito 23505 tratado
-- como sucesso), 0 'dead', 0 'failed', 0 'processing' residual.

SET search_path = '';

CREATE OR REPLACE FUNCTION public.wa_dequeue_webhook_items(p_limit INTEGER DEFAULT 50)
RETURNS SETOF public.wa_webhook_queue
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.wa_webhook_queue
  SET status = 'processing',
      next_attempt_at = now() + interval '2 minutes'
  WHERE id IN (
    SELECT id FROM public.wa_webhook_queue
    WHERE (
        (status IN ('pending', 'failed') AND next_attempt_at <= now())
        OR (status = 'processing' AND next_attempt_at <= now())
      )
    ORDER BY received_at
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.wa_dequeue_webhook_items(INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_dequeue_webhook_items(INTEGER) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wa_dequeue_webhook_items(INTEGER) TO service_role;

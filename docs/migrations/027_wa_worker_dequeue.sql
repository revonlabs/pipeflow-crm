-- Migration 027: WhatsApp Monitor — função de dequeue do worker
-- O PostgREST (cliente Supabase) não expõe FOR UPDATE SKIP LOCKED direto;
-- a forma correta é encapsular num RPC. Esta função seleciona até N itens
-- pending/failed com next_attempt_at <= now(), marca como 'processing'
-- atomicamente (evita dois workers concorrentes pegarem o mesmo item), e
-- retorna as linhas pro worker (Route Handler) processar.
--
-- Chamada só por service_role (o worker usa admin client, sem sessão).

SET search_path = '';

CREATE OR REPLACE FUNCTION public.wa_dequeue_webhook_items(p_limit INTEGER DEFAULT 50)
RETURNS SETOF public.wa_webhook_queue
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.wa_webhook_queue
  SET status = 'processing'
  WHERE id IN (
    SELECT id FROM public.wa_webhook_queue
    WHERE status IN ('pending', 'failed')
      AND next_attempt_at <= now()
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

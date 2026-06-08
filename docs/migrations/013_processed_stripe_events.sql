-- Tabela de idempotência do webhook Stripe.
-- Garante que cada event.id seja processado no máximo uma vez,
-- mesmo em caso de retry ou entrega duplicada pelo Stripe.

CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  event_id     TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sem RLS: a tabela é escrita apenas pelo service_role no webhook handler.
-- Limpeza automática de eventos com mais de 30 dias (opcional via pg_cron ou job externo).

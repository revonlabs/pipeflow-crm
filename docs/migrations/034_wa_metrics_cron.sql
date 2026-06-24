-- Migration 034: WhatsApp Monitor — Sprint 4 (Métricas, parte 3: pg_cron)
--
-- Reaproveita o mesmo secret de 028 ('wa_worker_secret' no Supabase Vault) —
-- não cria um secret novo, pois ambas as rotas usam o mesmo
-- WA_WORKER_SECRET de ambiente.
--
-- ⚠️ NÃO aplicar antes do deploy das rotas /api/wa/worker/aggregate-metrics e
-- /api/wa/worker/send-digests estarem respondendo em produção (mesma regra
-- de 028 — aplicar antes faz o pg_net acumular chamadas 404).
--
-- Idempotente: cron.schedule com mesmo job_name substitui o anterior.

-- Agregação horária: roda no minuto 0 de cada hora, agrega o dia corrente
-- (CURRENT_DATE default de wa_aggregate_metrics cobre o fuso do servidor
-- Postgres, consistente com timestamp_wa armazenado em UTC).
SELECT cron.schedule(
  'wa_aggregate_metrics',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://crm.revonlabs.com.br/api/wa/worker/aggregate-metrics',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'wa_worker_secret'
      ),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Varredura de resumos diários: roda a cada 15 minutos. A rota decide, com
-- base em wa_due_digest_workspaces, quais workspaces estão na janela atual —
-- granularidade de entrega de até 15min do horário escolhido pelo cliente.
SELECT cron.schedule(
  'wa_send_digests',
  '15 minutes',
  $$
  SELECT net.http_post(
    url := 'https://crm.revonlabs.com.br/api/wa/worker/send-digests',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'wa_worker_secret'
      ),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para remover/desativar (ex: durante manutenção):
-- SELECT cron.unschedule('wa_aggregate_metrics');
-- SELECT cron.unschedule('wa_send_digests');

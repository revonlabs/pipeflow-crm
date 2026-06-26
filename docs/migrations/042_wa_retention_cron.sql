-- Migration 042: WhatsApp Monitor — Sprint 6 (Retenção e Polish, parte 2: pg_cron)
--
-- Reaproveita o mesmo secret de 028/034 ('wa_worker_secret' no Supabase Vault).
--
-- ⚠️ NÃO aplicar antes do deploy da rota /api/wa/worker/retention-job estar
-- respondendo em produção (mesma regra de 028/034 — aplicar antes faz o
-- pg_net acumular chamadas 404 todo dia 1 do mês até o deploy).
--
-- Idempotente: cron.schedule com mesmo job_name substitui o anterior.

-- Job mensal de retenção: roda dia 1 de cada mês, 3h da manhã (spec §10.1).
SELECT cron.schedule(
  'wa_retention_job',
  '0 3 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://crm.revonlabs.com.br/api/wa/worker/retention-job',
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
-- SELECT cron.unschedule('wa_retention_job');

-- Migration 028: WhatsApp Monitor — pg_cron para o worker de processamento
--
-- Extensões pg_cron (1.6.4) e pg_net (0.20.0) já habilitadas no projeto
-- (aplicado separadamente, sem efeito colateral — só CREATE EXTENSION).
--
-- ⚠️ O cron.schedule abaixo NÃO foi aplicado ainda. Só rodar DEPOIS que
-- feature/wa-module estiver mergeado na main e o deploy na Vercel estiver
-- confirmado respondendo em
-- https://crm.revonlabs.com.br/api/wa/worker/process-queue
-- (checklist de deploy do Sprint 1 — ver wa-pgcrypto-sprint1-blocker).
-- Aplicar antes disso faz o pg_net acumular chamadas 404 a cada 15s.
--
-- Pré-requisito: secret 'wa_worker_secret' já criado no Supabase Vault
-- (vault.create_secret — feito manualmente por Pedro, fora desta migration,
-- pra nunca passar o valor pelo histórico do assistente). Confirmado presente
-- via `SELECT name FROM vault.decrypted_secrets WHERE name = 'wa_worker_secret'`.
--
-- Idempotente: cron.schedule com mesmo job_name substitui o anterior.

SELECT cron.schedule(
  'wa_process_webhook_queue',
  '15 seconds', -- sintaxe de segundos do Supabase Cron (Postgres >= 15.1.1.61)
  $$
  SELECT net.http_post(
    url := 'https://crm.revonlabs.com.br/api/wa/worker/process-queue',
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
-- SELECT cron.unschedule('wa_process_webhook_queue');

-- Migration 016: valor recorrente (assinatura) e valor de setup em deals
-- 'value' continua existindo e é mantido em sincronia (recurring_value + setup_value)
-- pelas Server Actions, para não quebrar leituras antigas (dashboard, funil).

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS recurring_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS setup_value NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Backfill: deals existentes têm seu 'value' tratado como 100% recorrente.
UPDATE public.deals
SET recurring_value = COALESCE(value, 0)
WHERE recurring_value = 0 AND setup_value = 0;

-- Migration 010: Índices em colunas de chave estrangeira
-- Postgres NÃO cria automaticamente índices em FKs.
-- Sem eles: JOINs e CASCADE ficam lentos (full table scan).
-- Ref: schema-foreign-key-indexes, query-missing-indexes

-- ─── leads ──────────────────────────────────────────────────────────────────

-- leads.workspace_id já tem idx_leads_workspace_email (workspace_id, email)
-- que cobre lookups por workspace — não precisa de índice separado.

CREATE INDEX IF NOT EXISTS idx_leads_owner_id
  ON public.leads (owner_id);

-- ─── deals ──────────────────────────────────────────────────────────────────

-- deals.workspace_id já coberto por idx_deals_workspace_stage_position.

CREATE INDEX IF NOT EXISTS idx_deals_lead_id
  ON public.deals (lead_id);

CREATE INDEX IF NOT EXISTS idx_deals_owner_id
  ON public.deals (owner_id);

-- ─── activities ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_activities_workspace_id
  ON public.activities (workspace_id);

CREATE INDEX IF NOT EXISTS idx_activities_lead_id
  ON public.activities (lead_id);

CREATE INDEX IF NOT EXISTS idx_activities_author_id
  ON public.activities (author_id);

-- Listing timeline de um lead ordenada por data — query mais frequente
CREATE INDEX IF NOT EXISTS idx_activities_lead_created
  ON public.activities (lead_id, created_at DESC);

-- ─── subscriptions ──────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_subscriptions_workspace_id
  ON public.subscriptions (workspace_id);

-- ─── workspace_members ──────────────────────────────────────────────────────
-- Índice composto (workspace_id, user_id) cobre a is_workspace_member lookup
-- melhor que dois índices separados (elimina bitmap heap scan).
-- O índice único (workspace_id, user_id) gerado pelo UNIQUE constraint já existe,
-- mas confirmamos para garantir que está presente.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'workspace_members_workspace_id_user_id_key'
      AND conrelid = 'public.workspace_members'::regclass
  ) THEN
    ALTER TABLE public.workspace_members
    ADD CONSTRAINT workspace_members_workspace_id_user_id_key
    UNIQUE (workspace_id, user_id);
  END IF;
END $$;

-- Migration 001: workspaces
-- Tabela central de tenants. Cada workspace é um tenant isolado.

CREATE TABLE IF NOT EXISTS workspaces (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT        NOT NULL,
  slug                TEXT        NOT NULL UNIQUE,
  plan                TEXT        NOT NULL DEFAULT 'free'
                                  CHECK (plan IN ('free', 'pro', 'payment_failed')),
  owner_id            UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_customer_id  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

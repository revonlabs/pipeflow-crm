-- Migration 003: leads

CREATE TABLE IF NOT EXISTS leads (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  email         TEXT,
  phone         TEXT,
  company       TEXT,
  role          TEXT,
  status        TEXT        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'inactive', 'converted', 'lost')),
  owner_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

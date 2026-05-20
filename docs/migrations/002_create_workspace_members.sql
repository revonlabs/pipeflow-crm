-- Migration 002: workspace_members
-- Tabela de membros por workspace. Define quem tem acesso a quê.

CREATE TABLE IF NOT EXISTS workspace_members (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT        NOT NULL DEFAULT 'member'
                            CHECK (role IN ('admin', 'member')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

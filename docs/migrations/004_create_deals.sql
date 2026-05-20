-- Migration 004: deals
-- position é usado para ordenação dentro de cada coluna do Kanban.

CREATE TABLE IF NOT EXISTS deals (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id       UUID        REFERENCES leads(id) ON DELETE SET NULL,
  title         TEXT        NOT NULL,
  value         NUMERIC(12, 2),
  stage         TEXT        NOT NULL DEFAULT 'new_lead'
                            CHECK (stage IN ('new_lead','contacted','proposal_sent','negotiation','won','lost')),
  position      INTEGER     NOT NULL DEFAULT 0,
  owner_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date      DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

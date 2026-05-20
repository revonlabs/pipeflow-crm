-- Migration 005: activities
-- Timeline de interações vinculadas a um lead.

CREATE TABLE IF NOT EXISTS activities (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id       UUID        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL
                            CHECK (type IN ('call','email','meeting','note')),
  description   TEXT        NOT NULL,
  author_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

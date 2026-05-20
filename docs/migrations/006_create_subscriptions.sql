-- Migration 006: subscriptions
-- Um registro por workspace. Atualizado pelo webhook do Stripe.

CREATE TABLE IF NOT EXISTS subscriptions (
  workspace_id              UUID        PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_subscription_id    TEXT,
  status                    TEXT,
  current_period_end        TIMESTAMPTZ
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

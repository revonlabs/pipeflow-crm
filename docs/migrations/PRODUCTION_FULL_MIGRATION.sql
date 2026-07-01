-- ============================================================
-- PipeFlow CRM — Migration completa para produção (idempotente)
-- Aplique inteiro no SQL Editor do Supabase (projeto de produção)
-- Todas as instruções são idempotente: IF NOT EXISTS / CREATE OR REPLACE
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Tabelas ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.workspaces (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT        NOT NULL,
  slug                TEXT        NOT NULL UNIQUE,
  plan                TEXT        NOT NULL DEFAULT 'free'
                                  CHECK (plan IN ('free', 'pro', 'payment_failed')),
  owner_id            UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_customer_id  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT        NOT NULL DEFAULT 'member'
                            CHECK (role IN ('admin', 'member')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.leads (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS public.deals (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lead_id       UUID        REFERENCES public.leads(id) ON DELETE SET NULL,
  title         TEXT        NOT NULL,
  value         NUMERIC(12, 2),
  stage         TEXT        NOT NULL DEFAULT 'new_lead'
                            CHECK (stage IN ('new_lead','contacted','proposal_sent','negotiation','won','lost')),
  position      INTEGER     NOT NULL DEFAULT 0,
  owner_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date      DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activities (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lead_id       UUID        NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL
                            CHECK (type IN ('call','email','meeting','note')),
  description   TEXT        NOT NULL,
  author_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  workspace_id              UUID        PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  stripe_subscription_id    TEXT,
  status                    TEXT,
  current_period_end        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email         TEXT        NOT NULL,
  token         TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  role          TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT now() + interval '7 days',
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de idempotência do webhook Stripe
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  event_id     TEXT        PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── RLS: habilitar em todas as tabelas ──────────────────────────────────────

ALTER TABLE public.workspaces        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.workspaces        FORCE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.leads             FORCE ROW LEVEL SECURITY;
ALTER TABLE public.deals             FORCE ROW LEVEL SECURITY;
ALTER TABLE public.activities        FORCE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions     FORCE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites FORCE ROW LEVEL SECURITY;

-- ─── Índices de performance ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_leads_name_trgm
  ON public.leads USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_company_trgm
  ON public.leads USING GIN (company gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_deals_title_trgm
  ON public.deals USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_workspace_email
  ON public.leads (workspace_id, email);
CREATE INDEX IF NOT EXISTS idx_deals_workspace_stage_position
  ON public.deals (workspace_id, stage, position);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace
  ON public.workspace_members (workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user
  ON public.workspace_members (user_id);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id
  ON public.leads (owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_lead_id
  ON public.deals (lead_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner_id
  ON public.deals (owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_workspace_id
  ON public.activities (workspace_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id
  ON public.activities (lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_author_id
  ON public.activities (author_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_created
  ON public.activities (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_workspace_id
  ON public.subscriptions (workspace_id);
CREATE INDEX IF NOT EXISTS workspace_invites_workspace_id_idx
  ON public.workspace_invites (workspace_id);
CREATE INDEX IF NOT EXISTS workspace_invites_token_idx
  ON public.workspace_invites (token);
CREATE INDEX IF NOT EXISTS workspace_invites_email_idx
  ON public.workspace_invites (email);

-- ─── Funções helper (SECURITY DEFINER, search_path hardened) ─────────────────

CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL  ON FUNCTION public.is_workspace_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID) TO authenticated;

-- Espelha is_workspace_member, filtrando role = 'admin' (ver 023_wa_rls_policies.sql)
CREATE OR REPLACE FUNCTION public.is_workspace_admin(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

REVOKE ALL  ON FUNCTION public.is_workspace_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_workspace(
  workspace_name TEXT,
  workspace_slug TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_workspace_id UUID;
  v_user_id      UUID;
  v_slug         TEXT := workspace_slug;
BEGIN
  v_user_id := (SELECT auth.uid());

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  BEGIN
    INSERT INTO public.workspaces (name, slug, owner_id)
    VALUES (workspace_name, v_slug, v_user_id)
    RETURNING id INTO v_workspace_id;
  EXCEPTION WHEN unique_violation THEN
    v_slug := v_slug || '-' || substr(md5(gen_random_uuid()::text), 1, 6);
    INSERT INTO public.workspaces (name, slug, owner_id)
    VALUES (workspace_name, v_slug, v_user_id)
    RETURNING id INTO v_workspace_id;
  END;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace_id, v_user_id, 'admin');

  RETURN v_workspace_id;
END;
$$;

REVOKE ALL  ON FUNCTION public.create_workspace(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_workspace(TEXT, TEXT) TO authenticated;

-- ─── Policies RLS ─────────────────────────────────────────────────────────────

-- workspaces
DROP POLICY IF EXISTS "workspaces_select" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_insert" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_delete" ON public.workspaces;

CREATE POLICY "workspaces_select" ON public.workspaces
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(id));

CREATE POLICY "workspaces_insert" ON public.workspaces
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- Apenas admin pode atualizar (fix 014: self-join corrigido)
CREATE POLICY "workspaces_update" ON public.workspaces
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.user_id = (SELECT auth.uid())
        AND workspace_members.role = 'admin'
    )
  );

CREATE POLICY "workspaces_delete" ON public.workspaces
  FOR DELETE TO authenticated
  USING (owner_id = (SELECT auth.uid()));

-- workspace_members
DROP POLICY IF EXISTS "wm_select" ON public.workspace_members;
DROP POLICY IF EXISTS "wm_insert" ON public.workspace_members;
DROP POLICY IF EXISTS "wm_update" ON public.workspace_members;
DROP POLICY IF EXISTS "wm_delete" ON public.workspace_members;

CREATE POLICY "wm_select" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- Apenas o próprio usuário pode inserir a si mesmo (aceitar convite)
CREATE POLICY "wm_insert" ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_workspace_member(workspace_id)
  );

CREATE POLICY "wm_update" ON public.workspace_members
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "wm_delete" ON public.workspace_members
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- leads
DROP POLICY IF EXISTS "leads_select" ON public.leads;
DROP POLICY IF EXISTS "leads_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_update" ON public.leads;
DROP POLICY IF EXISTS "leads_delete" ON public.leads;

-- Member só vê leads onde é owner_id; admin vê todos (043_leads_deals_owner_visibility.sql)
CREATE POLICY "leads_select" ON public.leads
  FOR SELECT TO authenticated
  USING (
    public.is_workspace_admin(workspace_id)
    OR owner_id = (SELECT auth.uid())
  );
CREATE POLICY "leads_insert" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "leads_update" ON public.leads
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id));
CREATE POLICY "leads_delete" ON public.leads
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- deals
DROP POLICY IF EXISTS "deals_select" ON public.deals;
DROP POLICY IF EXISTS "deals_insert" ON public.deals;
DROP POLICY IF EXISTS "deals_update" ON public.deals;
DROP POLICY IF EXISTS "deals_delete" ON public.deals;

-- Member vê deals onde é owner_id (do deal ou do lead vinculado); admin vê todos
-- (043_leads_deals_owner_visibility.sql)
CREATE POLICY "deals_select" ON public.deals
  FOR SELECT TO authenticated
  USING (
    public.is_workspace_admin(workspace_id)
    OR owner_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = deals.lead_id
        AND leads.owner_id = (SELECT auth.uid())
    )
  );
CREATE POLICY "deals_insert" ON public.deals
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "deals_update" ON public.deals
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id));
CREATE POLICY "deals_delete" ON public.deals
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- activities
DROP POLICY IF EXISTS "activities_select" ON public.activities;
DROP POLICY IF EXISTS "activities_insert" ON public.activities;
DROP POLICY IF EXISTS "activities_update" ON public.activities;
DROP POLICY IF EXISTS "activities_delete" ON public.activities;

CREATE POLICY "activities_select" ON public.activities
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));
CREATE POLICY "activities_insert" ON public.activities
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "activities_update" ON public.activities
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id));
CREATE POLICY "activities_delete" ON public.activities
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- subscriptions: leitura para membros, escrita apenas via service_role (webhook)
DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;

CREATE POLICY "subscriptions_select" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- workspace_invites
DROP POLICY IF EXISTS "invites_select" ON public.workspace_invites;
DROP POLICY IF EXISTS "invites_insert" ON public.workspace_invites;
DROP POLICY IF EXISTS "invites_delete" ON public.workspace_invites;

CREATE POLICY "invites_select" ON public.workspace_invites
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_invites.workspace_id
        AND wm.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "invites_insert" ON public.workspace_invites
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_invites.workspace_id
        AND wm.user_id = (SELECT auth.uid())
        AND wm.role = 'admin'
    )
  );

CREATE POLICY "invites_delete" ON public.workspace_invites
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_invites.workspace_id
        AND wm.user_id = (SELECT auth.uid())
        AND wm.role = 'admin'
    )
  );

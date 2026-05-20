-- Migration 008: índices de performance
-- pg_trgm permite buscas LIKE/ILIKE rápidas em texto livre.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Busca por nome e empresa em leads
CREATE INDEX IF NOT EXISTS idx_leads_name_trgm
  ON public.leads USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_leads_company_trgm
  ON public.leads USING GIN (company gin_trgm_ops);

-- Busca por título em deals
CREATE INDEX IF NOT EXISTS idx_deals_title_trgm
  ON public.deals USING GIN (title gin_trgm_ops);

-- Lookup de lead por email dentro de um workspace (unicidade + filtro)
CREATE INDEX IF NOT EXISTS idx_leads_workspace_email
  ON public.leads (workspace_id, email);

-- Ordenação do Kanban por estágio + posição
CREATE INDEX IF NOT EXISTS idx_deals_workspace_stage_position
  ON public.deals (workspace_id, stage, position);

-- Lookup de membros por workspace (JOIN frequente nas policies)
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace
  ON public.workspace_members (workspace_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user
  ON public.workspace_members (user_id);

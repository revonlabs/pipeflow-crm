-- Migration 043: leads/deals — visibilidade por owner para members
-- Admin do workspace continua vendo todos os leads/deals (is_workspace_admin,
-- ver 023_wa_rls_policies.sql). Member só vê os que é owner_id.
-- Deals: member também vê se for owner_id do lead vinculado (handoff entre
-- vendedores — quem cadastrou o lead pode não ser quem fecha a negociação).
-- Leads/deals com owner_id NULL ficam visíveis só para admin (comparação com
-- NULL nunca é TRUE, então a condição owner_id = auth.uid() nunca cobre órfãos).

SET search_path = '';

-- ─── leads ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "leads_select" ON public.leads;

CREATE POLICY "leads_select" ON public.leads
  FOR SELECT TO authenticated
  USING (
    public.is_workspace_admin(workspace_id)
    OR owner_id = (SELECT auth.uid())
  );

-- ─── deals ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "deals_select" ON public.deals;

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

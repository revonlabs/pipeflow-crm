-- Migration 023: WhatsApp Monitor — RLS policies
-- Reusa o padrão existente (is_workspace_member, ver 007_rls_policies.sql).
-- Acrescenta is_workspace_admin: o módulo WA é admin-only por princípio de
-- menor privilégio (spec §3.2) — member nunca acessa dado de conversa.
--
-- wa_webhook_queue: sem policy para authenticated. Só service_role (admin
-- client) lê/escreve, igual ao padrão de subscriptions/Stripe webhook.
-- wa_audit_log: sem policy de UPDATE/DELETE — auditoria imutável (spec §3.7).

SET search_path = '';

-- ─── helpers ────────────────────────────────────────────────────────────────

-- Retorna true se o usuário autenticado é admin do workspace.
-- Espelha is_workspace_member (007), filtrando role = 'admin'.
CREATE OR REPLACE FUNCTION public.is_workspace_admin(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_workspace_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(UUID) TO authenticated;

-- ─── wa_instances ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "wa_instances_select" ON public.wa_instances;
DROP POLICY IF EXISTS "wa_instances_insert" ON public.wa_instances;
DROP POLICY IF EXISTS "wa_instances_update" ON public.wa_instances;
DROP POLICY IF EXISTS "wa_instances_delete" ON public.wa_instances;

CREATE POLICY "wa_instances_select" ON public.wa_instances
  FOR SELECT TO authenticated
  USING (public.is_workspace_admin(workspace_id));

CREATE POLICY "wa_instances_insert" ON public.wa_instances
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_admin(workspace_id));

CREATE POLICY "wa_instances_update" ON public.wa_instances
  FOR UPDATE TO authenticated
  USING (public.is_workspace_admin(workspace_id));

CREATE POLICY "wa_instances_delete" ON public.wa_instances
  FOR DELETE TO authenticated
  USING (public.is_workspace_admin(workspace_id));

-- ─── wa_contacts ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "wa_contacts_select" ON public.wa_contacts;
DROP POLICY IF EXISTS "wa_contacts_insert" ON public.wa_contacts;
DROP POLICY IF EXISTS "wa_contacts_update" ON public.wa_contacts;
DROP POLICY IF EXISTS "wa_contacts_delete" ON public.wa_contacts;

CREATE POLICY "wa_contacts_select" ON public.wa_contacts
  FOR SELECT TO authenticated
  USING (public.is_workspace_admin(workspace_id));

CREATE POLICY "wa_contacts_insert" ON public.wa_contacts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_admin(workspace_id));

CREATE POLICY "wa_contacts_update" ON public.wa_contacts
  FOR UPDATE TO authenticated
  USING (public.is_workspace_admin(workspace_id));

CREATE POLICY "wa_contacts_delete" ON public.wa_contacts
  FOR DELETE TO authenticated
  USING (public.is_workspace_admin(workspace_id));

-- ─── wa_conversations ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "wa_conversations_select" ON public.wa_conversations;
DROP POLICY IF EXISTS "wa_conversations_insert" ON public.wa_conversations;
DROP POLICY IF EXISTS "wa_conversations_update" ON public.wa_conversations;
DROP POLICY IF EXISTS "wa_conversations_delete" ON public.wa_conversations;

CREATE POLICY "wa_conversations_select" ON public.wa_conversations
  FOR SELECT TO authenticated
  USING (public.is_workspace_admin(workspace_id));

CREATE POLICY "wa_conversations_insert" ON public.wa_conversations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_admin(workspace_id));

CREATE POLICY "wa_conversations_update" ON public.wa_conversations
  FOR UPDATE TO authenticated
  USING (public.is_workspace_admin(workspace_id));

CREATE POLICY "wa_conversations_delete" ON public.wa_conversations
  FOR DELETE TO authenticated
  USING (public.is_workspace_admin(workspace_id));

-- ─── wa_messages ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "wa_messages_select" ON public.wa_messages;
DROP POLICY IF EXISTS "wa_messages_insert" ON public.wa_messages;
DROP POLICY IF EXISTS "wa_messages_update" ON public.wa_messages;
DROP POLICY IF EXISTS "wa_messages_delete" ON public.wa_messages;

CREATE POLICY "wa_messages_select" ON public.wa_messages
  FOR SELECT TO authenticated
  USING (public.is_workspace_admin(workspace_id));

-- INSERT direto por authenticated cobre a intervenção do admin pelo painel
-- (Sprint 5). Ingestão via webhook usa service_role (sem sessão), não esta policy.
CREATE POLICY "wa_messages_insert" ON public.wa_messages
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_admin(workspace_id));

CREATE POLICY "wa_messages_update" ON public.wa_messages
  FOR UPDATE TO authenticated
  USING (public.is_workspace_admin(workspace_id));

-- Sem DELETE: mensagens não se apagam (auditoria/retenção — spec §2 princípio 3).
-- Arquivamento (Sprint 6) move linha, não apaga.

-- ─── wa_response_metrics ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "wa_response_metrics_select" ON public.wa_response_metrics;

-- Métricas são só leitura para admin; escrita é do cron de agregação via
-- service_role (Sprint 4) — sem policy de INSERT/UPDATE para authenticated.
CREATE POLICY "wa_response_metrics_select" ON public.wa_response_metrics
  FOR SELECT TO authenticated
  USING (public.is_workspace_admin(workspace_id));

-- ─── wa_audit_log — auditoria imutável ──────────────────────────────────────
-- Apenas INSERT e SELECT para authenticated. Sem UPDATE/DELETE: nenhuma
-- policy é criada para essas operações, e RLS + FORCE RLS bloqueia por
-- padrão qualquer comando sem policy correspondente (spec §3.7/§11.1).

DROP POLICY IF EXISTS "wa_audit_log_select" ON public.wa_audit_log;
DROP POLICY IF EXISTS "wa_audit_log_insert" ON public.wa_audit_log;

CREATE POLICY "wa_audit_log_select" ON public.wa_audit_log
  FOR SELECT TO authenticated
  USING (public.is_workspace_admin(workspace_id));

-- Insert exige que o user_id logado seja o próprio autor da ação (evita
-- forjar audit log em nome de outro usuário) e que ele seja admin do workspace.
CREATE POLICY "wa_audit_log_insert" ON public.wa_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_workspace_admin(workspace_id)
  );

-- ─── wa_webhook_queue — sem policy para authenticated ──────────────────────
-- Só service_role (admin client) lê/escreve, pois a ingestão do webhook não
-- tem sessão de usuário (mesmo padrão de "subscriptions" no webhook Stripe).
-- RLS + FORCE RLS já bloqueia authenticated por ausência de policy.

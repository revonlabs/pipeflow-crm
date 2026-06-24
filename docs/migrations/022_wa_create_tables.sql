-- Migration 022: WhatsApp Monitor — schema das tabelas wa_*
-- Módulo de monitoramento de WhatsApp dentro do CRM (multi-tenant por workspace_id).
-- Fonte da verdade: wa-monitor-spec.md §4.1, adaptado às convenções deste repo
-- (Supabase Auth + RLS via is_workspace_member; ver migration 023 para as policies).
--
-- Nesta migration: apenas tabelas, índices, ENABLE/FORCE RLS. As policies vêm na 023.
-- Criptografia pgcrypto de content_text/media_url é Sprint 1 (colunas TEXT por ora).
-- Idempotente: CREATE ... IF NOT EXISTS em tudo.

SET search_path = '';

-- ============================================================================
-- wa_instances — números de WhatsApp (instâncias da Evolution) por workspace
-- ============================================================================
-- ON DELETE RESTRICT (intencional, assimétrico em relação às demais tabelas wa_*):
-- não é possível apagar um workspace enquanto ele tiver instância vinculada.
-- Força o admin a desconectar/remover a instância da Evolution antes — evita
-- apagar um workspace "vivo" no WhatsApp e perder o número em produção.
CREATE TABLE IF NOT EXISTS public.wa_instances (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE RESTRICT,
  evolution_instance_name VARCHAR(100) NOT NULL UNIQUE,
  phone_number            VARCHAR(20) NOT NULL,
  display_name            VARCHAR(100) NOT NULL,
  owner_user_id           UUID        REFERENCES auth.users(id) ON DELETE SET NULL, -- vendedor dono do número (opcional)
  status                  VARCHAR(20) NOT NULL DEFAULT 'disconnected',
  webhook_secret          VARCHAR(64) NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'), -- HMAC secret
  webhook_token           VARCHAR(64) NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex') UNIQUE, -- token na URL do webhook
  last_seen_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT wa_instances_status_valid
    CHECK (status IN ('connected', 'disconnected', 'qr_pending', 'banned'))
);

ALTER TABLE public.wa_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_instances FORCE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_wa_instances_workspace ON public.wa_instances (workspace_id);

-- ============================================================================
-- wa_contacts — contatos (números externos) que conversam com as instâncias
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wa_contacts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  phone_number    VARCHAR(20) NOT NULL,
  display_name    VARCHAR(200),
  profile_pic_url TEXT,
  is_blocked      BOOLEAN     NOT NULL DEFAULT FALSE,
  anonymized_at   TIMESTAMPTZ, -- LGPD: marca quando o contato foi anonimizado (direito ao esquecimento)
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, phone_number)
);

ALTER TABLE public.wa_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_contacts FORCE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_wa_contacts_workspace_phone
  ON public.wa_contacts (workspace_id, phone_number);

-- ============================================================================
-- wa_conversations — conversa entre uma instância e um contato
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wa_conversations (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  instance_id          UUID        NOT NULL REFERENCES public.wa_instances(id) ON DELETE CASCADE,
  contact_id           UUID        NOT NULL REFERENCES public.wa_contacts(id) ON DELETE CASCADE,
  status               VARCHAR(20) NOT NULL DEFAULT 'active',
  last_message_at      TIMESTAMPTZ,
  last_message_preview VARCHAR(200),
  unread_count         INTEGER     NOT NULL DEFAULT 0,
  first_response_at    TIMESTAMPTZ, -- primeira resposta do vendedor (para SLA)
  sla_breach_at        TIMESTAMPTZ, -- quando rompeu o SLA de resposta
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT wa_conversations_status_valid CHECK (status IN ('active', 'archived')),
  UNIQUE (instance_id, contact_id)
);

ALTER TABLE public.wa_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_conversations FORCE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_wa_conversations_workspace_last
  ON public.wa_conversations (workspace_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_conversations_instance
  ON public.wa_conversations (instance_id, last_message_at DESC);

-- ============================================================================
-- wa_messages — tabela quente (últimos 90 dias; arquivo particionado vem no Sprint 6)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wa_messages (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID         NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  conversation_id     UUID         NOT NULL REFERENCES public.wa_conversations(id) ON DELETE CASCADE,
  evolution_message_id VARCHAR(100) NOT NULL, -- idempotência: webhook reenviado não duplica
  direction           VARCHAR(3)   NOT NULL,  -- in | out
  sent_by             VARCHAR(30)  NOT NULL,  -- contact | vendor | admin_intervention | automation
  intervention_user_id UUID        REFERENCES auth.users(id) ON DELETE SET NULL, -- admin que interveio
  content_type        VARCHAR(20)  NOT NULL,  -- text | image | audio | video | document | location | contact | sticker
  content_text        TEXT,                   -- Sprint 1: criptografar via pgcrypto antes de dado real em produção
  media_url           TEXT,                   -- URL interna proxied (Sprint 1)
  media_mime          VARCHAR(50),
  media_size_bytes    INTEGER,
  -- DÍVIDA TÉCNICA (Sprint 1): sem content_text_search (TSVECTOR) por ora.
  -- Busca full-text sobre content_text só pode ser desenhada junto com a
  -- criptografia pgcrypto (índice sobre texto cifrado não funciona; precisa
  -- decidir busca client-side pós-decrypt vs. campo derivado descriptografado
  -- em background). Resolver no Sprint 1, não antes.
  metadata            JSONB,                  -- payload original sanitizado (sem PII em log)
  status              VARCHAR(20),            -- sent | delivered | read | failed
  timestamp_wa        TIMESTAMPTZ  NOT NULL,  -- timestamp do WhatsApp
  received_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT wa_messages_direction_valid CHECK (direction IN ('in', 'out')),
  CONSTRAINT wa_messages_sent_by_valid
    CHECK (sent_by IN ('contact', 'vendor', 'admin_intervention', 'automation')),
  CONSTRAINT wa_messages_evolution_id_unique UNIQUE (evolution_message_id)
);

ALTER TABLE public.wa_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_messages FORCE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_wa_messages_conv
  ON public.wa_messages (conversation_id, timestamp_wa DESC);
CREATE INDEX IF NOT EXISTS idx_wa_messages_workspace_time
  ON public.wa_messages (workspace_id, received_at DESC);

-- ============================================================================
-- wa_webhook_queue — fila de payloads crus da Evolution (sem Redis)
-- Worker (pg_cron + Route Handler interno) drena por status/next_attempt_at — Sprint 1.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wa_webhook_queue (
  id              BIGSERIAL   PRIMARY KEY,
  workspace_id    UUID        NOT NULL,
  instance_id     UUID        NOT NULL,
  event_type      VARCHAR(50) NOT NULL,
  payload         JSONB       NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at    TIMESTAMPTZ,
  attempts        INTEGER     NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- backoff: cron só pega itens com next_attempt_at <= now()
  last_error      TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  CONSTRAINT wa_webhook_queue_status_valid
    CHECK (status IN ('pending', 'processing', 'done', 'failed', 'dead'))
);

ALTER TABLE public.wa_webhook_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_webhook_queue FORCE ROW LEVEL SECURITY;

-- Índice que o cron usa para selecionar o próximo lote (status pendente/falho + janela de backoff).
CREATE INDEX IF NOT EXISTS idx_wa_webhook_queue_status_next
  ON public.wa_webhook_queue (status, next_attempt_at)
  WHERE status IN ('pending', 'failed');

-- ============================================================================
-- wa_audit_log — auditoria imutável de toda ação humana no painel
-- Sem UPDATE/DELETE (ver migration 023 — apenas INSERT/SELECT para authenticated).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wa_audit_log (
  id          BIGSERIAL   PRIMARY KEY,
  workspace_id UUID       NOT NULL,
  user_id     UUID        NOT NULL,
  action      VARCHAR(50) NOT NULL,
    -- view_conversation | send_intervention | export_data | change_settings
    -- | login | logout | view_dashboard
  target_type VARCHAR(30),
  target_id   UUID,
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wa_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_audit_log FORCE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_wa_audit_workspace_time
  ON public.wa_audit_log (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_audit_user
  ON public.wa_audit_log (user_id, created_at DESC);

-- ============================================================================
-- wa_response_metrics — métricas pré-agregadas por instância/dia (cron — Sprint 4)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wa_response_metrics (
  workspace_id              UUID    NOT NULL,
  instance_id               UUID    NOT NULL,
  date                      DATE    NOT NULL,
  total_in                  INTEGER NOT NULL DEFAULT 0,
  total_out                 INTEGER NOT NULL DEFAULT 0,
  unique_contacts           INTEGER NOT NULL DEFAULT 0,
  conversations_started     INTEGER NOT NULL DEFAULT 0,
  conversations_unanswered_1h INTEGER NOT NULL DEFAULT 0,
  avg_first_response_seconds INTEGER,
  avg_response_seconds      INTEGER,
  peak_hour                 INTEGER, -- 0-23
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, instance_id, date)
);

ALTER TABLE public.wa_response_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_response_metrics FORCE ROW LEVEL SECURITY;

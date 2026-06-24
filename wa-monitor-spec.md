# Módulo WhatsApp Monitor — Especificação Técnica

**Projeto:** Revon CRM — Módulo de Monitoramento WhatsApp
**Domínio:** `crm.revonlabs.com.br/whatsapp`
**Versão:** 1.0
**Stack base:** Next.js (App Router) + Node/Express + PostgreSQL + Redis + Socket.io + Evolution API
**Autor:** Pedro / Revon Labs

---

## 1. Objetivo

Construir um módulo dentro do CRM existente para que **administradores de workspace** possam:

- Visualizar conversas de WhatsApp dos vendedores em tempo real
- Acessar histórico completo e auditável de mensagens
- Acompanhar métricas operacionais (tempo de resposta, volume, SLA)
- Intervir pontualmente em conversas quando necessário
- Tudo com isolamento total por workspace (multi-tenant)

**Não-objetivos (V1):**
- Atendimento ativo pela plataforma como ferramenta principal
- Chatbot ou IA generativa
- Análise de sentimento ou classificação automática
- Aplicativo mobile dedicado

---

## 2. Princípios de Arquitetura

Todo desenvolvimento deve seguir estes princípios — sem exceção:

1. **Multi-tenant by design** — toda query, endpoint, evento e log carrega `workspace_id`. Postgres Row-Level Security ativado como segunda camada de defesa.
2. **Idempotência em ingestão** — webhooks da Evolution podem repetir; o sistema nunca deve duplicar mensagens.
3. **Auditoria imutável** — nada se deleta; mensagens antigas se arquivam, ações humanas são logadas.
4. **Falha isolada** — webhook caindo, Evolution desconectando ou banco lento não derrubam o CRM principal.
5. **Observabilidade antes de otimização** — instrumentar primeiro, otimizar depois com base em dados reais.
6. **Princípio do menor privilégio** — viewers nunca acessam dados, apenas admins do workspace.
7. **Defesa em profundidade** — autenticação, autorização, RLS, validação de input, sanitização de saída. Múltiplas camadas, não uma única.

---

## 3. Segurança — Requisitos não-negociáveis

### 3.1 Autenticação e Autorização

- **JWT** com expiração curta (15min) + refresh token rotativo (httpOnly cookie)
- **MFA obrigatório** para usuários com role `admin` (TOTP via app)
- **Lockout** após 5 tentativas de login falhas — 15min de bloqueio
- **Sessions persistidas** em Redis com possibilidade de revogação imediata
- **Logout em todos os dispositivos** disponível ao admin

### 3.2 Controle de acesso ao módulo

| Role | Acesso ao módulo WhatsApp |
|------|---------------------------|
| `workspace_admin` | Acesso completo (visualização + intervenção) |
| `workspace_member` | **Sem acesso** ao módulo WhatsApp |
| `super_admin` (Revon) | Acesso apenas via "modo suporte" auditado |

**Middleware obrigatório em toda rota `/api/wa/*`:**
1. Valida JWT
2. Carrega user e workspace_id da sessão
3. Verifica se user é admin do workspace solicitado
4. Define contexto Postgres (`SET app.current_workspace_id`)
5. Loga acesso em `wa_audit_log`

### 3.3 Isolamento de workspace (multi-tenant)

**Camada 1 — Aplicação:**
Todo repository/query carrega `workspace_id` como primeiro parâmetro. Code review reprova qualquer query sem isso.

**Camada 2 — Banco (RLS):**
```sql
ALTER TABLE wa_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON wa_messages
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid);
```

Mesmo se um dev esquecer o WHERE, o Postgres bloqueia.

**Camada 3 — Socket.io:**
Rooms estritamente por workspace. Cliente nunca decide em que sala entra — backend decide com base no JWT.

### 3.4 Dados sensíveis e LGPD

- **Criptografia em repouso:** PostgreSQL com `pgcrypto`, campos de conteúdo (`content_text`, `media_url`) criptografados com chave por workspace
- **Criptografia em trânsito:** HTTPS obrigatório, HSTS ativado, TLS 1.3
- **Webhooks autenticados:** HMAC SHA-256 com secret por instância
- **Logs sem PII:** mensagens nunca aparecem em logs de aplicação, apenas IDs e metadados
- **Direito ao esquecimento:** endpoint admin para anonimizar contato (mantém estrutura, zera dados pessoais)
- **Política de retenção:** mensagens ativas 90 dias, depois arquivo; mídia 30 dias depois deleção física

### 3.5 Mídia

- **Nunca servir mídia direto da Evolution** — proxy obrigatório através do backend com autorização
- **URLs assinadas** com expiração de 5 minutos
- **Validação de MIME type** antes de aceitar (whitelist: image/*, audio/*, application/pdf, etc.)
- **Limite de tamanho** por arquivo (configurável por workspace, default 16MB)
- **Storage isolado por workspace** em pastas separadas (ou bucket/prefix se S3)

### 3.6 Webhooks

- Endpoint **único e secreto por instância**: `/api/wa/webhook/:workspace_id/:instance_id?token=<random>`
- Validação HMAC do payload
- Rate limit por IP (Evolution conhecida vs. tudo mais)
- Rejeita payload se `workspace_id` na URL não bate com o configurado para o token

### 3.7 Auditoria

Toda ação humana no painel gera registro em `wa_audit_log`:
- Visualização de conversa (lista qual)
- Envio de mensagem pelo painel
- Exportação de dados
- Mudança de configuração
- Login/logout

Logs imutáveis (sem UPDATE/DELETE permitido via permissão de role do Postgres).

---

## 4. Modelo de Dados

### 4.1 Tabelas

```sql
-- ============================================
-- WORKSPACES E USUÁRIOS (já existentes no CRM)
-- ============================================
-- Assumindo que workspaces e users já existem
-- workspace_members(workspace_id, user_id, role)

-- ============================================
-- INSTÂNCIAS WHATSAPP
-- ============================================
CREATE TABLE wa_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  evolution_instance_name VARCHAR(100) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  owner_user_id UUID REFERENCES users(id), -- vendedor dono do número (opcional)
  status VARCHAR(20) NOT NULL DEFAULT 'disconnected',
    -- connected | disconnected | qr_pending | banned
  webhook_secret VARCHAR(64) NOT NULL, -- HMAC secret
  webhook_token VARCHAR(64) NOT NULL UNIQUE, -- URL token
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT status_valid CHECK (status IN ('connected','disconnected','qr_pending','banned'))
);
CREATE INDEX idx_wa_instances_workspace ON wa_instances(workspace_id);

-- ============================================
-- CONTATOS
-- ============================================
CREATE TABLE wa_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  phone_number VARCHAR(20) NOT NULL,
  display_name VARCHAR(200),
  profile_pic_url TEXT,
  is_blocked BOOLEAN DEFAULT FALSE,
  anonymized_at TIMESTAMPTZ, -- LGPD: marca quando foi anonimizado
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, phone_number)
);
CREATE INDEX idx_wa_contacts_workspace_phone ON wa_contacts(workspace_id, phone_number);

-- ============================================
-- CONVERSAS
-- ============================================
CREATE TABLE wa_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  instance_id UUID NOT NULL REFERENCES wa_instances(id),
  contact_id UUID NOT NULL REFERENCES wa_contacts(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active | archived
  last_message_at TIMESTAMPTZ,
  last_message_preview VARCHAR(200),
  unread_count INTEGER NOT NULL DEFAULT 0,
  first_response_at TIMESTAMPTZ, -- primeira resposta do vendedor
  sla_breach_at TIMESTAMPTZ, -- quando rompeu SLA
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(instance_id, contact_id)
);
CREATE INDEX idx_wa_conversations_workspace_last ON wa_conversations(workspace_id, last_message_at DESC);
CREATE INDEX idx_wa_conversations_instance ON wa_conversations(instance_id, last_message_at DESC);

-- ============================================
-- MENSAGENS (tabela quente, últimos 90 dias)
-- ============================================
CREATE TABLE wa_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  conversation_id UUID NOT NULL REFERENCES wa_conversations(id),
  evolution_message_id VARCHAR(100) NOT NULL, -- idempotência
  direction VARCHAR(3) NOT NULL, -- in | out
  sent_by VARCHAR(30) NOT NULL,
    -- contact | vendor | admin_intervention | automation
  intervention_user_id UUID REFERENCES users(id), -- quem interveio
  content_type VARCHAR(20) NOT NULL, -- text | image | audio | video | document | location | contact | sticker
  content_text TEXT, -- criptografado via pgcrypto
  content_text_search TSVECTOR, -- índice de busca (gerado de content_text descriptografado em background, ou aceita não-busca em content criptografado — decidir trade-off)
  media_url TEXT, -- URL interna proxied
  media_mime VARCHAR(50),
  media_size_bytes INTEGER,
  metadata JSONB, -- payload original sanitizado
  status VARCHAR(20), -- sent | delivered | read | failed
  timestamp_wa TIMESTAMPTZ NOT NULL, -- timestamp do whatsapp
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(evolution_message_id)
);
CREATE INDEX idx_wa_messages_conv ON wa_messages(conversation_id, timestamp_wa DESC);
CREATE INDEX idx_wa_messages_workspace_time ON wa_messages(workspace_id, received_at DESC);

-- ============================================
-- ARQUIVO DE MENSAGENS (> 90 dias)
-- ============================================
CREATE TABLE wa_messages_archive (
  -- mesma estrutura de wa_messages
  -- particionada por mês: wa_messages_archive_2025_06, etc.
  LIKE wa_messages INCLUDING ALL
) PARTITION BY RANGE (timestamp_wa);

-- Exemplo de partição:
CREATE TABLE wa_messages_archive_2025_06 PARTITION OF wa_messages_archive
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

-- ============================================
-- FILA DE WEBHOOKS (raw payloads)
-- ============================================
CREATE TABLE wa_webhook_queue (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL,
  instance_id UUID NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' -- pending | processing | done | failed | dead
);
CREATE INDEX idx_wa_webhook_queue_status ON wa_webhook_queue(status, received_at)
  WHERE status IN ('pending','failed');

-- ============================================
-- AUDITORIA
-- ============================================
CREATE TABLE wa_audit_log (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
    -- view_conversation | send_intervention | export_data
    -- change_settings | login | logout | view_dashboard
  target_type VARCHAR(30),
  target_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_wa_audit_workspace_time ON wa_audit_log(workspace_id, created_at DESC);
CREATE INDEX idx_wa_audit_user ON wa_audit_log(user_id, created_at DESC);

-- Revoga permissão de UPDATE/DELETE na audit_log
-- (apenas role específica de admin de banco pode tocar)

-- ============================================
-- MÉTRICAS PRÉ-AGREGADAS
-- ============================================
CREATE TABLE wa_response_metrics (
  workspace_id UUID NOT NULL,
  instance_id UUID NOT NULL,
  date DATE NOT NULL,
  total_in INTEGER NOT NULL DEFAULT 0,
  total_out INTEGER NOT NULL DEFAULT 0,
  unique_contacts INTEGER NOT NULL DEFAULT 0,
  conversations_started INTEGER NOT NULL DEFAULT 0,
  conversations_unanswered_1h INTEGER NOT NULL DEFAULT 0,
  avg_first_response_seconds INTEGER,
  avg_response_seconds INTEGER,
  peak_hour INTEGER, -- 0-23
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(workspace_id, instance_id, date)
);
```

### 4.2 Row-Level Security

```sql
-- Ativar RLS em todas as tabelas wa_*
ALTER TABLE wa_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_response_metrics ENABLE ROW LEVEL SECURITY;

-- Policy padrão de isolamento
CREATE POLICY tenant_isolation ON wa_messages
  FOR ALL
  USING (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

-- Repetir para todas as tabelas wa_*

-- Roles separadas
-- app_user: pode SELECT/INSERT/UPDATE em tabelas wa_* (sujeito a RLS)
-- app_audit: pode SELECT em wa_audit_log, sem UPDATE/DELETE
-- app_admin: bypass RLS (uso restrito, apenas migrations)
```

---

## 5. Ingestão de Webhook

### 5.1 Endpoint

```
POST /api/wa/webhook/:workspace_id/:instance_id?token=<webhook_token>
```

**Fluxo:**

1. **Validação rápida (< 50ms)**
   - Verifica `token` confere com `wa_instances.webhook_token`
   - Verifica assinatura HMAC do header `X-Hub-Signature-256` contra `webhook_secret`
   - Rate limit por IP via Redis
2. **Persistência crua**
   - Insere payload em `wa_webhook_queue` com status `pending`
3. **Resposta imediata**
   - Retorna `200 OK` em < 50ms
4. **Processamento assíncrono**
   - Worker (BullMQ ou pg-boss) lê da fila
   - Faz UPSERT em `wa_contacts`, `wa_conversations`
   - INSERT em `wa_messages` com UNIQUE em `evolution_message_id`
   - Em caso de duplicata: ignora silenciosamente (idempotente)
   - Emite evento Socket.io para o workspace
5. **Retry**
   - Falha → backoff exponencial: 5s, 30s, 2min, 10min
   - Após 5 tentativas: status `dead`, alerta para Pedro

### 5.2 Eventos da Evolution a tratar

- `messages.upsert` — nova mensagem (in ou out)
- `messages.update` — atualização de status
- `connection.update` — instância conectou/desconectou
- `contacts.update` — atualização de info do contato

### 5.3 Mídia

Quando chega mensagem com mídia:

1. Worker baixa o arquivo da Evolution
2. Valida MIME type e tamanho
3. Salva em storage isolado por workspace
4. URL no banco aponta pra endpoint proxy autenticado
5. Endpoint serve com URL assinada de 5min

---

## 6. API REST — Endpoints

Todos sob `/api/wa/*`, todos exigem middleware de auth + admin role.

### Conversas

```
GET    /api/wa/conversations
       ?status=active&instance_id=X&search=texto
       &page=1&limit=20
GET    /api/wa/conversations/:id
GET    /api/wa/conversations/:id/messages?before=<timestamp>&limit=50
POST   /api/wa/conversations/:id/archive
POST   /api/wa/conversations/:id/messages   -- intervenção
```

### Instâncias

```
GET    /api/wa/instances
GET    /api/wa/instances/:id
POST   /api/wa/instances                    -- criar nova
POST   /api/wa/instances/:id/connect        -- gera QR
POST   /api/wa/instances/:id/disconnect
```

### Métricas

```
GET    /api/wa/metrics/overview?from=DATE&to=DATE
GET    /api/wa/metrics/by-instance?from=DATE&to=DATE
GET    /api/wa/metrics/response-time?instance_id=X
```

### Auditoria

```
GET    /api/wa/audit?user_id=X&from=DATE&action=X
```

### Mídia (proxy autenticado)

```
GET    /api/wa/media/:message_id           -- URL assinada
GET    /api/wa/media/signed/:token         -- entrega o arquivo
```

---

## 7. Tempo Real (Socket.io)

### 7.1 Conexão

```javascript
// Cliente conecta com JWT
const socket = io('/wa', { auth: { token: jwt }});

// Backend valida e coloca em sala
io.of('/wa').use(async (socket, next) => {
  const { token } = socket.handshake.auth;
  const session = await validateJWT(token);
  if (!session) return next(new Error('unauthorized'));
  if (session.role !== 'workspace_admin') return next(new Error('forbidden'));

  socket.data.userId = session.userId;
  socket.data.workspaceId = session.workspaceId;
  socket.join(`workspace:${session.workspaceId}`);
  next();
});
```

### 7.2 Eventos emitidos

```
message:new         -- { conversation_id, preview, timestamp }
message:status      -- { message_id, status }
conversation:update -- { conversation_id, unread_count }
instance:status     -- { instance_id, status }
sla:breach          -- { conversation_id, breach_at }
```

**Regra crítica:** payloads contêm apenas IDs e preview curto. Conteúdo completo só via API REST autenticada.

---

## 8. Métricas

### 8.1 Agregação

Cron job a cada hora:

```sql
-- Atualiza métricas do dia corrente
INSERT INTO wa_response_metrics (...)
SELECT
  workspace_id, instance_id, CURRENT_DATE,
  COUNT(*) FILTER (WHERE direction = 'in') as total_in,
  COUNT(*) FILTER (WHERE direction = 'out') as total_out,
  COUNT(DISTINCT contact_id) as unique_contacts,
  -- ... mais agregações
FROM wa_messages m
JOIN wa_conversations c ON c.id = m.conversation_id
WHERE m.received_at::date = CURRENT_DATE
GROUP BY workspace_id, instance_id
ON CONFLICT (workspace_id, instance_id, date)
DO UPDATE SET ...;
```

### 8.2 Resumo diário (cron 18h)

Worker gera resumo a partir de `wa_response_metrics`, formata em template fixo e:
- Salva como notificação in-app
- Envia por email ao admin do workspace
- Opcional: envia por WhatsApp via instância de automação

---

## 9. Intervenção do Admin

### 9.1 UX

Ao tentar enviar:
- Mostra "última atividade do vendedor há X min"
- Se < 2min, modal: "vendedor pode estar respondendo agora. Confirmar?"
- Mensagem enviada marca `sent_by = admin_intervention`
- No histórico, aparece visualmente diferente (cor, ícone, "Intervenção do admin")

### 9.2 Backend

```
POST /api/wa/conversations/:id/messages
{ content_type: 'text', content: '...' }
```

Fluxo:
1. Valida user é admin do workspace da conversa
2. Loga em `wa_audit_log` ANTES de enviar
3. Chama Evolution API para enviar
4. Persiste em `wa_messages` com `sent_by = admin_intervention`
5. Emite evento Socket.io
6. Em caso de erro: marca audit_log com falha, retorna erro ao cliente

---

## 10. Retenção e Arquivamento

### 10.1 Job mensal

Roda dia 1 de cada mês, 3h da manhã:

1. **Mensagens > 90 dias** → move para `wa_messages_archive_<ano>_<mes>`
2. **Cria nova partição** para o mês corrente, se não existir
3. **Mídia > 30 dias** → deleta arquivo físico, mantém metadado no banco com `media_expired = true`
4. **Contatos anonimizados há > 30 dias** → remove referências físicas

### 10.2 Acesso a arquivo

Quando admin busca mensagem antiga, query vai automaticamente para a tabela archive correspondente (partição). Indicador visual: "Conversa arquivada — carregando histórico estendido".

---

## 11. Observabilidade

### 11.1 Logs

- **Formato:** JSON estruturado (pino)
- **Campos obrigatórios:** `workspace_id`, `user_id`, `request_id`, `level`, `msg`
- **Proibido:** logar `content_text`, números de telefone completos, tokens
- **Destino:** stdout → Easypanel coleta → opcional: enviar para Better Stack ou Axiom

### 11.2 Métricas técnicas

Endpoint `/api/wa/health` retorna:
- Status do banco
- Status do Redis
- Status de cada instância da Evolution (last_seen)
- Tamanho da fila de webhooks
- Itens em status `dead`

### 11.3 Alertas

Cron a cada 5min verifica:
- Instância Evolution offline > 10min → alerta
- Fila com > 1000 itens pendentes → alerta
- Webhook falhando > 10x em 5min → alerta
- Banco com query lenta > 5s → alerta

Canais de alerta: Telegram (Pedro) + email (Pedro + Owen).

---

## 12. Estrutura de Pastas (Next.js + backend)

```
crm-revon/
├── app/
│   └── (dashboard)/
│       └── whatsapp/
│           ├── page.tsx              -- lista de conversas
│           ├── [id]/page.tsx         -- conversa individual
│           ├── instances/page.tsx    -- gestão de números
│           ├── metrics/page.tsx      -- dashboard
│           └── audit/page.tsx        -- log de auditoria
├── lib/
│   └── wa/
│       ├── auth.ts                   -- middleware admin
│       ├── encryption.ts             -- pgcrypto wrapper
│       └── socket.ts                 -- cliente socket
├── server/
│   └── wa/
│       ├── routes/
│       │   ├── webhook.ts
│       │   ├── conversations.ts
│       │   ├── messages.ts
│       │   ├── instances.ts
│       │   ├── metrics.ts
│       │   └── media.ts
│       ├── workers/
│       │   ├── webhook-processor.ts
│       │   ├── metrics-aggregator.ts
│       │   ├── daily-summary.ts
│       │   ├── retention.ts
│       │   └── health-monitor.ts
│       ├── services/
│       │   ├── evolution-client.ts
│       │   ├── conversation-service.ts
│       │   └── audit-service.ts
│       └── repositories/
│           ├── messages-repo.ts
│           └── ...
└── migrations/
    └── wa/
        ├── 001_create_tables.sql
        ├── 002_enable_rls.sql
        └── ...
```

---

## 13. Roadmap de Implementação

### Sprint 0 — Fundação (5 dias úteis)
- Schema completo aplicado
- RLS ativado e testado
- Middleware de auth + admin check
- Audit log funcional
- Health check endpoint
- Logging estruturado

**Critério de aceite:** Admin loga, abre rota vazia do módulo, ação é logada, RLS bloqueia query sem `workspace_id`.

### Sprint 1 — Ingestão (5 dias úteis)
- Endpoint de webhook com HMAC
- Fila + worker BullMQ
- Idempotência via UNIQUE
- Persistência de mensagens
- Tratamento de mídia (proxy)
- Retry com backoff

**Critério de aceite:** Evolution envia 1000 mensagens em sequência, todas chegam ao banco sem duplicata, sem perda. Cair o worker por 1min e religar: zero perda.

### Sprint 2 — Visualização (5 dias úteis)
- Lista de conversas com filtros
- Tela de conversa com histórico
- Paginação por scroll infinito
- Busca por texto e contato
- Render de mídia inline

**Critério de aceite:** Admin abre conversa de 5000 mensagens, scroll fluido, busca retorna em < 500ms.

### Sprint 3 — Tempo Real (3-4 dias)
- Socket.io com rooms por workspace
- Eventos `message:new`, `conversation:update`
- Badge de não-lidas
- Reconnect automático

**Critério de aceite:** Mensagem chega na Evolution, aparece no painel em < 2s. Dois admins do mesmo workspace veem ao mesmo tempo. Admin de outro workspace não vê nada.

### Sprint 4 — Métricas (5 dias úteis)
- Cron de agregação
- Dashboard de métricas
- Resumo diário por email
- Alertas de SLA

**Critério de aceite:** Dashboard carrega em < 300ms com 6 meses de histórico. Resumo diário chega às 18h pontualmente.

### Sprint 5 — Intervenção (5 dias úteis)
- Endpoint de envio
- UI de intervenção com warning
- Flag visual no histórico
- Auditoria de intervenção
- Testes de conflito de estado

**Critério de aceite:** Admin envia mensagem, chega no WhatsApp do contato em < 5s. Vendedor e admin enviando simultaneamente: ambas chegam, ambas logadas, sem corrupção de estado.

### Sprint 6 — Retenção e Polish (3-4 dias)
- Job mensal de arquivamento
- Limpeza de mídia expirada
- Anonimização (LGPD)
- Alertas operacionais
- Documentação final

**Critério de aceite:** Job roda, dados antigos arquivados, mídia limpa, banco não cresce descontroladamente.

**Total estimado:** 6-7 semanas de dev focado.

---

## 14. Mitigação de Riscos (Resumo)

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| Vazamento entre workspaces | Crítica | RLS + middleware + code review + testes automatizados |
| Mensagem duplicada | Alta | UNIQUE em `evolution_message_id` |
| Mensagem perdida no webhook | Alta | Fila persistente + retry + dead letter |
| Evolution desconecta sem aviso | Média | Health check + alerta automático |
| Conflito admin/vendedor | Média | Warning UX + flag de auditoria |
| Banco crescer sem controle | Média | Particionamento + retenção 90d + arquivo |
| Mídia ocupando disco | Média | Expiração 30d + storage externo opcional |
| Socket.io vazar dados | Alta | Rooms estritas + payload mínimo + auth no handshake |
| Dev novo quebrar multi-tenant | Alta | RLS como rede de segurança |
| Webhook DoS | Média | Rate limit por IP + HMAC obrigatório |
| Token de webhook vazar | Alta | Token único por instância, rotacionável |
| LGPD: dado sensível em log | Alta | Linter contra logs de conteúdo + auditoria mensal |
| Backup ausente | Crítica | pg_dump diário + retenção 30d + teste de restore mensal |

---

## 15. Checklist de Segurança Antes do Deploy

- [ ] Todas tabelas `wa_*` com RLS ativado
- [ ] Policies de RLS testadas com usuário de workspace diferente
- [ ] Middleware admin em todas rotas `/api/wa/*`
- [ ] JWT com expiração curta + refresh rotativo
- [ ] MFA configurado para todos os admins
- [ ] HTTPS forçado, HSTS ativado
- [ ] Webhook secrets gerados aleatoriamente (256 bits)
- [ ] Rate limit em endpoints públicos
- [ ] Logs sem PII (verificado por grep no código)
- [ ] Backup automatizado e testado
- [ ] pgcrypto configurado para campos sensíveis
- [ ] Permissões de role do Postgres revisadas
- [ ] Endpoint /health não expõe info sensível
- [ ] Auditoria não permite UPDATE/DELETE em logs
- [ ] Política de retenção implementada e testada
- [ ] LGPD: endpoint de anonimização funcional

---

## 16. O que NÃO entra na V1

Lista explícita do que fica pra V2 ou nunca:

- Atendimento em time grande (Chatwoot é melhor)
- IA generativa, classificação automática
- Chatbot integrado
- App mobile
- Múltiplos canais (Instagram, email)
- Templates de mensagem do WhatsApp Business
- Disparos em massa (deve continuar no n8n separado)
- White-label
- Integração com outros CRMs
- Relatórios exportáveis em PDF
- CSAT

---

## 17. Stack e Custos Operacionais

**Stack:**
- Next.js 14+ (App Router)
- Node.js 20+ / Express
- PostgreSQL 16+ (com pgcrypto, RLS)
- Redis 7+ (cache + filas)
- Socket.io 4+
- BullMQ (workers)
- Pino (logs)
- Evolution API (já rodando)

**Hospedagem (atual KVM2):**
- Aguenta até ~15 clientes confortavelmente
- Acima disso: VPS separada para Evolution

**Backup:**
- pg_dump diário
- Retenção 30 dias
- Storage: backblaze B2 ou similar (custo baixo)
- **Restore testado mensalmente** (não-negociável)

---

**Fim do documento.**

Versão 1.0 — Base para iniciar desenvolvimento no Claude Code.

# Revon Studio CRM — Project Briefing for Claude Code

SaaS de gestão de clientes e vendas com pipeline Kanban visual, multi-empresa, planos Free/Pro. Público-alvo: PMEs, freelancers e times de vendas brasileiros.

PRD completo: [docs/PRD.md](docs/PRD.md)

---

## Stack

| Camada | Tecnologia | Papel |
|---|---|---|
| Framework | Next.js 14 (App Router) | Roteamento, SSR, API Routes |
| UI | React 18 + Tailwind CSS | Componentes e estilos |
| Componentes | shadcn/ui (New York style) | Design system base |
| Linguagem | TypeScript 5 (strict) | Tipagem em todo o projeto |
| Banco + Auth | Supabase (PostgreSQL + RLS) | Dados, autenticação, RLS por workspace |
| Drag-and-drop | @dnd-kit/core + @dnd-kit/sortable | Pipeline Kanban |
| Gráficos | Recharts | Funil e métricas do dashboard |
| Pagamento | Stripe | Checkout, webhooks, Customer Portal |
| E-mail | Resend | Convites, notificações transacionais |
| Deploy | Vercel | Frontend + API Routes |

---

## Estrutura de Pastas

```
/
├── app/
│   ├── (auth)/                  # Rotas públicas: login, signup, forgot-password
│   ├── (app)/                   # Shell autenticado
│   │   ├── dashboard/
│   │   ├── leads/
│   │   │   └── [id]/            # Detalhe do lead + timeline
│   │   ├── pipeline/
│   │   ├── settings/
│   │   │   ├── workspace/       # Nome, plano, membros
│   │   │   └── billing/         # Stripe Customer Portal
│   │   └── layout.tsx           # Sidebar + workspace switcher
│   ├── api/
│   │   ├── webhooks/stripe/     # POST — ativa/desativa plano
│   │   └── invites/             # POST — aceitar convite
│   └── layout.tsx               # Root layout (fontes, providers)
├── components/
│   ├── ui/                      # shadcn/ui primitivos (não editar manualmente)
│   ├── kanban/                  # KanbanBoard, KanbanColumn, DealCard
│   ├── leads/                   # LeadForm, LeadList, LeadDetail, ActivityTimeline
│   ├── dashboard/               # MetricCard, FunnelChart, UpcomingDeals
│   └── shared/                  # Sidebar, WorkspaceSwitcher, UserMenu, EmptyState
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # createBrowserClient()
│   │   ├── server.ts            # createServerClient() — Server Components/Actions
│   │   └── middleware.ts        # updateSession() para Next.js middleware
│   ├── stripe.ts                # Stripe SDK singleton
│   └── resend.ts                # Resend SDK singleton
├── types/
│   └── index.ts                 # Interfaces: Workspace, Lead, Deal, Activity, Member
├── hooks/
│   ├── useWorkspace.ts          # Workspace ativo do contexto
│   └── useSubscription.ts      # Estado do plano (free/pro + limites)
├── docs/
│   └── PRD.md
├── supabase/
│   └── migrations/              # Arquivos SQL numerados sequencialmente
└── CLAUDE.md
```

---

## Schema do Banco (Supabase / PostgreSQL)

Todas as tabelas têm RLS ativa. O isolamento de dados é por `workspace_id`.

```sql
workspaces        (id, name, slug, owner_id, plan, stripe_customer_id, created_at)
workspace_members (workspace_id, user_id, role)          -- role: 'admin' | 'member'
invites           (id, workspace_id, email, token, role, expires_at, accepted_at)
leads             (id, workspace_id, name, email, phone, company, role, status, owner_id, created_at)
deals             (id, workspace_id, lead_id, title, value, stage, owner_id, due_date, created_at)
activities        (id, workspace_id, lead_id, type, description, author_id, created_at)
subscriptions     (workspace_id, stripe_subscription_id, status, current_period_end)
```

Estágios do pipeline: `new_lead | contacted | proposal_sent | negotiation | won | lost`

Status de lead: `active | inactive | converted | lost`

Tipos de atividade: `call | email | meeting | note`

---

## Convenções de Código

- **TypeScript strict** — sem `any`, sem `as unknown`
- **Named exports** em todos os arquivos (sem `export default` exceto em `page.tsx` e `layout.tsx`, que o Next.js exige)
- **Server Components por padrão** — adicionar `"use client"` apenas quando necessário (interatividade, hooks de estado/efeito)
- **Server Actions** para mutações (create, update, delete) — não criar API Routes para CRUD interno
- **RLS no Supabase** — nunca bypassar com `service_role` em código do cliente; usar apenas em webhooks server-side
- **Variáveis de ambiente** — acessar via `process.env.NEXT_PUBLIC_*` no cliente, `process.env.*` no servidor
- **Sem comentários óbvios** — comentar apenas o "porquê" de decisões não óbvias
- **Componentes pequenos** — extrair subcomponente quando ultrapassa ~150 linhas

---

## Identidade Visual

Paleta Fox Fire / Night Sky (tokens `--color-crm-*` em `src/app/globals.css`), seguindo o brand system da Revon Labs. Fundo sempre escuro — não existe modo claro.

| Elemento | Valor | Token CSS |
|---|---|---|
| Background | `#060B14` | `--color-crm-bg` |
| Surface (sidebar, cards) | `#0D1B2E` | `--color-crm-surface` |
| Surface 2 | `#112240` | `--color-crm-surface-2` |
| Border | `#2A2A2E` | `--color-crm-border` |
| Border sutil | `#1E1E22` | `--color-crm-border-s` |
| Texto primário | `#F0F8FF` | `--color-crm-text` |
| Texto secundário | `#8BACD4` | `--color-crm-text-sec` |
| Texto muted | `#4A6785` | `--color-crm-text-muted` |
| Acento (CTA, ativo) | `#FF7043` | `--color-crm-accent` |
| Positivo | `#3BFFA0` | `--color-crm-positive` |
| Negativo | `#FF4444` | `--color-crm-negative` |
| Aviso | `#FFAB40` | `--color-crm-warm` |
| Informação | `#4A90E2` | `--color-crm-cool` |
| Tipografia | Inter (next/font/google) + JetBrains Mono | — |
| Border radius | `rounded-lg` (8px) padrão shadcn New York | — |
| Sombra | `shadow-sm` — sem sombras pesadas | — |
| Motion | `transition-all duration-200` — sem animações complexas | — |

shadcn/ui **New York** style. Não criar componentes custom quando shadcn já cobre o caso de uso.

Layout: sidebar fixa de 240px + área de conteúdo. Sidebar colapsa em mobile (`md:hidden`).

---

## Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # apenas webhooks server-side

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=

# Resend
RESEND_API_KEY=

# WhatsApp Monitor (módulo /wa)
WA_MASTER_KEY=                      # obrigatória — gerar com `openssl rand -base64 32`; ver src/lib/wa/README.md
WA_WORKER_SECRET=                   # obrigatória — gerar com `openssl rand -base64 32`; protege o endpoint interno do worker (pg_cron)
EVOLUTION_API_URL=                  # base URL da instância Evolution API (self-hosted/cloud)
EVOLUTION_API_KEY=                  # API key global, enviada no header `apikey`

# App
NEXT_PUBLIC_APP_URL=                # ex: https://pipeflow.vercel.app
```

---

## Limites dos Planos

| Recurso | Free | Pro |
|---|---|---|
| Colaboradores | 2 | Ilimitado |
| Leads | 50 | Ilimitado |
| Workspaces | 1 | Ilimitado |
| Preço | Grátis | R$49/mês |

Checar limites via `useSubscription` hook antes de permitir criação de lead/membro.

---

## Milestones

1. **Scaffold** — create-next-app, Tailwind, shadcn/ui, Supabase, envs
2. **Auth** — login, registro, magic link, middleware
3. **Multi-workspace** — criar workspace, convite (Resend), papéis
4. **Leads** — CRUD, filtros, detalhe + timeline de atividades
5. **Pipeline Kanban** — DnD Kit, deal cards, persistência
6. **Dashboard** — metric cards, funil Recharts, deals próximos
7. **Monetização** — Stripe Checkout, webhook, Customer Portal
8. **Landing Page** — hero, features, pricing, CTA
9. **Polish & Deploy** — skeletons, error boundaries, RLS audit, Vercel

# PipeFlow CRM — Plano de Execução por Milestones

**Estratégia:** interface primeiro, backend depois.
Cada milestone começa pelos componentes e páginas com dados mockados, depois conecta ao Supabase/APIs reais. Isso permite validar o design antes de escrever SQL.

---

## M0 — Project Scaffold

**Branch:** `feat/scaffold`
**Objetivo:** Criar o projeto Next.js com todas as dependências instaladas, estrutura de pastas definida e configurações base prontas. Nenhuma página funcional — só a fundação.

### Entregas

#### Projeto
- [ ] `npx create-next-app@latest` com TypeScript, Tailwind, App Router, src/ desativado
- [ ] Remover boilerplate padrão do Next.js (page.tsx, globals.css padrão)
- [ ] Criar estrutura de pastas conforme CLAUDE.md: `app/`, `components/`, `lib/`, `types/`, `hooks/`, `supabase/migrations/`

#### Dependências
- [ ] `@supabase/supabase-js` + `@supabase/ssr`
- [ ] `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`
- [ ] `recharts`
- [ ] `stripe` + `@stripe/stripe-js`
- [ ] `resend`
- [ ] `zod` (validação de formulários e Server Actions)
- [ ] `next/font` com Inter já configurado

#### shadcn/ui
- [ ] `npx shadcn@latest init` — New York style, cor base `slate`
- [ ] Instalar componentes iniciais: `button`, `input`, `card`, `badge`, `dialog`, `sheet`, `dropdown-menu`, `avatar`, `separator`, `skeleton`, `toast`, `form`, `label`, `select`, `textarea`

#### Tailwind
- [ ] Adicionar tokens de cor no `tailwind.config.ts`: `brand-navy: #1B2559`, `brand-blue: #4F8EF7`
- [ ] Configurar `backgroundImage` e `fontFamily` se necessário

#### Tipos base
- [ ] Criar `types/index.ts` com interfaces: `Workspace`, `WorkspaceMember`, `Invite`, `Lead`, `Deal`, `Activity`, `Subscription`
- [ ] Criar `types/enums.ts` com: `DealStage`, `LeadStatus`, `ActivityType`, `MemberRole`, `PlanType`

#### Configurações
- [ ] Criar `.env.local` com todas as vars de `CLAUDE.md` (valores vazios)
- [ ] Criar `.env.example` para o repositório
- [ ] Configurar `next.config.ts` base
- [ ] Criar `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts` (estrutura vazia com TODO)
- [ ] Criar `lib/stripe.ts` e `lib/resend.ts` (estrutura vazia com TODO)

### Commit Final
```
feat: project scaffold — Next.js 14, Tailwind, shadcn/ui, types, folder structure
```

---

## M1 — Design System & App Shell

**Branch:** `feat/design-system`
**Objetivo:** Construir o shell visual completo da aplicação autenticada — sidebar, layout, navegação e estados vazios — com dados totalmente mockados. Ao final deste milestone, é possível navegar entre todas as seções do app sem autenticação real.

### Entregas

#### Layout raiz
- [ ] `app/layout.tsx` — fonte Inter, `<Toaster />`, providers globais
- [ ] `app/(app)/layout.tsx` — shell autenticado: sidebar fixa 240px + `<main>` com scroll

#### Sidebar (`components/shared/Sidebar.tsx`)
- [ ] Logo PipeFlow no topo
- [ ] Itens de navegação: Dashboard, Leads, Pipeline, Configurações
- [ ] Ícones com `lucide-react`
- [ ] Estado ativo da rota com `usePathname()`
- [ ] Versão mobile: colapsável via `<Sheet />` do shadcn

#### WorkspaceSwitcher (`components/shared/WorkspaceSwitcher.tsx`)
- [ ] Dropdown com workspaces mockados
- [ ] Opção "Criar workspace"
- [ ] Avatar do workspace (iniciais)

#### UserMenu (`components/shared/UserMenu.tsx`)
- [ ] Avatar + nome do usuário (mockado)
- [ ] Links: Configurações, Sair

#### EmptyState (`components/shared/EmptyState.tsx`)
- [ ] Componente reutilizável: ícone, título, descrição, botão CTA opcional

#### Páginas placeholder
- [ ] `app/(app)/dashboard/page.tsx` — título + EmptyState
- [ ] `app/(app)/leads/page.tsx` — título + EmptyState
- [ ] `app/(app)/pipeline/page.tsx` — título + EmptyState
- [ ] `app/(app)/settings/workspace/page.tsx` — título + EmptyState
- [ ] `app/(app)/settings/billing/page.tsx` — título + EmptyState

#### Responsividade
- [ ] Sidebar oculta em mobile, abre via botão hambúrguer no header
- [ ] Header mobile com logo + hambúrguer + UserMenu

### Commit Final
```
feat: app shell — sidebar, workspace switcher, nav layout, placeholder pages
```

---

## M2 — Autenticação

**Branch:** `feat/auth`
**Objetivo:** Login, registro e recuperação de senha funcionando com Supabase Auth. Middleware protegendo rotas autenticadas. Magic link operacional.

### Entregas — Interface primeiro

#### Layout de auth
- [ ] `app/(auth)/layout.tsx` — layout centralizado, background `slate-50`, logo no topo

#### Páginas de auth
- [ ] `app/(auth)/login/page.tsx` — form e-mail + senha + link "Entrar com magic link" + link para cadastro
- [ ] `app/(auth)/signup/page.tsx` — form nome + e-mail + senha + confirmação de senha
- [ ] `app/(auth)/forgot-password/page.tsx` — form e-mail
- [ ] `app/(auth)/magic-link/page.tsx` — tela de confirmação "verifique seu e-mail"
- [ ] `app/(auth)/confirm/page.tsx` — callback do magic link (redireciona para `/dashboard`)

#### Componentes
- [ ] `components/auth/AuthForm.tsx` — form base reutilizável com `react-hook-form` + `zod`
- [ ] Validações: e-mail válido, senha mínimo 8 chars, campos obrigatórios
- [ ] Estado de loading nos botões de submit

### Entregas — Backend

#### Supabase Auth
- [ ] Criar projeto no Supabase, copiar URL e keys para `.env.local`
- [ ] Habilitar provider Email no dashboard Supabase
- [ ] Configurar `lib/supabase/client.ts` com `createBrowserClient()`
- [ ] Configurar `lib/supabase/server.ts` com `createServerClient()` usando cookies do Next.js
- [ ] Configurar `lib/supabase/middleware.ts` com `updateSession()`
- [ ] Criar `middleware.ts` na raiz — proteger todas as rotas de `/(app)`, redirecionar `/` para `/dashboard` se logado

#### Server Actions (`app/(auth)/actions.ts`)
- [ ] `signIn(email, password)` — login com e-mail/senha
- [ ] `signUp(name, email, password)` — registro + inserção de perfil
- [ ] `signOut()` — logout + redirect para `/login`
- [ ] `sendMagicLink(email)` — OTP via Supabase
- [ ] `resetPassword(email)` — envio de reset

#### Redirecionamentos
- [ ] Login bem-sucedido → `/dashboard` (ou `/onboarding` se sem workspace)
- [ ] Rota protegida sem sessão → `/login`
- [ ] Já logado tentando acessar `/login` → `/dashboard`

### Commit Final
```
feat: auth — supabase email/password + magic link + middleware route protection
```

---

## M3 — Onboarding & Multi-Workspace

**Branch:** `feat/workspace`
**Objetivo:** Fluxo de onboarding para novos usuários (criar workspace), convite de colaboradores por e-mail e alternância entre workspaces. Isolamento de dados por RLS.

### Entregas — Interface primeiro

#### Onboarding
- [ ] `app/(app)/onboarding/page.tsx` — stepper de 3 passos: 1) Nome do workspace, 2) Convidar time, 3) Criar primeiro lead
- [ ] `components/shared/StepIndicator.tsx` — indicador visual de progresso
- [ ] Step 1: form com nome do workspace + slug gerado automaticamente
- [ ] Step 2: input de e-mail com botão "Convidar" + lista de convites pendentes
- [ ] Step 3: CTA para ir direto para criação de lead (pode pular)

#### Configurações de Workspace
- [ ] `app/(app)/settings/workspace/page.tsx` — nome, slug, danger zone (deletar workspace)
- [ ] Lista de membros com avatar, nome, papel (Admin/Membro) e botão "Remover"
- [ ] Modal de convite por e-mail com seleção de papel
- [ ] Badge de plano atual (Free/Pro) com link para billing

#### WorkspaceSwitcher real
- [ ] Listar workspaces do usuário logado
- [ ] Indicador de plano no item do workspace
- [ ] Botão "Novo workspace" (bloqueado no Free se já tiver 1)

### Entregas — Backend

#### Migrations (`supabase/migrations/`)
- [ ] `001_workspaces.sql` — tabela `workspaces` + RLS (owner pode tudo, membro pode ler)
- [ ] `002_workspace_members.sql` — tabela `workspace_members` + RLS
- [ ] `003_invites.sql` — tabela `invites` + RLS (admin do workspace pode criar)
- [ ] Políticas RLS: membro só vê dados do próprio workspace via `workspace_id`

#### Server Actions (`app/(app)/workspace/actions.ts`)
- [ ] `createWorkspace(name)` — cria workspace + adiciona criador como Admin
- [ ] `inviteMember(workspaceId, email, role)` — cria invite + envia e-mail via Resend
- [ ] `removeMember(workspaceId, userId)` — remove membro (Admin only)
- [ ] `updateWorkspace(workspaceId, data)` — atualiza nome/slug

#### Resend (`lib/resend.ts`)
- [ ] Configurar cliente com `RESEND_API_KEY`
- [ ] Template de e-mail de convite: nome do workspace, link de aceite, validade 7 dias
- [ ] `app/api/invites/route.ts` — GET `?token=xxx` → valida token → adiciona membro → redirect `/dashboard`

#### Contexto de workspace (`hooks/useWorkspace.ts`)
- [ ] Context provider com workspace ativo (persistido em cookie)
- [ ] Hook `useWorkspace()` retorna workspace ativo + lista de workspaces

### Commit Final
```
feat: workspace — onboarding, multi-workspace, member invites via Resend, RLS isolation
```

---

## M4 — Leads & Contatos

**Branch:** `feat/leads`
**Objetivo:** CRUD completo de leads, listagem com busca e filtros, página de detalhe com perfil e timeline de atividades.

### Entregas — Interface primeiro

#### Listagem de Leads
- [ ] `app/(app)/leads/page.tsx` — Server Component que renderiza `<LeadList />`
- [ ] `components/leads/LeadList.tsx` — tabela com colunas: nome, empresa, status, responsável, criado em, ações
- [ ] `components/leads/LeadFilters.tsx` — barra de busca + selects: Status, Responsável, Ordenar por
- [ ] `components/leads/LeadStatusBadge.tsx` — badge colorido por status
- [ ] Paginação simples (20 por página)
- [ ] Skeleton de carregamento para a tabela
- [ ] Estado vazio com `<EmptyState />` + botão "Criar primeiro lead"

#### Criação/Edição de Lead
- [ ] `components/leads/LeadFormModal.tsx` — `<Dialog />` com form: nome*, e-mail*, telefone, empresa, cargo, status, responsável
- [ ] Validação com zod: e-mail válido, campos obrigatórios marcados
- [ ] Botão "Novo Lead" no header da listagem (bloqueado se limite Free atingido)

#### Detalhe do Lead
- [ ] `app/(app)/leads/[id]/page.tsx` — Server Component
- [ ] `components/leads/LeadDetail.tsx` — perfil completo: avatar (iniciais), nome, badge de status, todos os campos
- [ ] `components/leads/ActivityTimeline.tsx` — lista cronológica de atividades
- [ ] `components/leads/ActivityForm.tsx` — form inline: tipo (ligação/e-mail/reunião/nota), descrição, data
- [ ] Botão "Registrar atividade" abre form inline
- [ ] Botão "Editar lead" abre `<LeadFormModal />`
- [ ] Botão "Converter para deal" abre modal de criação de negócio

### Entregas — Backend

#### Migrations
- [ ] `004_leads.sql` — tabela `leads` + RLS (membro do workspace pode criar/ler/editar)
- [ ] `005_activities.sql` — tabela `activities` + RLS

#### Server Actions (`app/(app)/leads/actions.ts`)
- [ ] `createLead(workspaceId, data)` — verifica limite Free (50 leads) antes de inserir
- [ ] `updateLead(leadId, data)` — atualiza campos
- [ ] `deleteLead(leadId)` — soft delete (status = 'lost') ou hard delete
- [ ] `createActivity(leadId, data)` — registra atividade + revalida cache da página

#### Queries
- [ ] `lib/queries/leads.ts` — `getLeads(workspaceId, filters)` com filtros e paginação
- [ ] `lib/queries/leads.ts` — `getLeadById(id)` com activities join
- [ ] Índices: `workspace_id`, `status`, `owner_id`, `created_at`

### Commit Final
```
feat: leads — CRUD, list with filters, detail page, activity timeline
```

---

## M5 — Pipeline Kanban

**Branch:** `feat/pipeline`
**Objetivo:** Board Kanban visual com drag-and-drop entre etapas, cards de negócios e persistência de posição no banco.

### Entregas — Interface primeiro

#### Board Kanban
- [ ] `app/(app)/pipeline/page.tsx` — Server Component, busca deals agrupados por etapa
- [ ] `components/kanban/KanbanBoard.tsx` — `"use client"`, `<DndContext />` do @dnd-kit, renderiza colunas
- [ ] `components/kanban/KanbanColumn.tsx` — `<SortableContext />`, título da etapa, total do valor (R$), contagem de cards, botão "+ Deal"
- [ ] `components/kanban/DealCard.tsx` — card draggável: título, valor em R$, nome do lead, avatar do responsável, badge de prazo (vermelho se vencido)
- [ ] Animação de drag com `DragOverlay` do @dnd-kit
- [ ] Seis colunas fixas: Novo Lead, Contato Realizado, Proposta Enviada, Negociação, Fechado Ganho, Fechado Perdido
- [ ] Colunas "Fechado Ganho" e "Fechado Perdido" com visual diferenciado (verde/vermelho)

#### Criação de Deal
- [ ] `components/kanban/DealFormModal.tsx` — `<Dialog />`: título*, valor (R$), lead vinculado (select), responsável, prazo
- [ ] Select de lead com busca inline
- [ ] Botão "+ Deal" em cada coluna abre o modal com etapa pré-selecionada

#### Detalhe do Deal (sidebar)
- [ ] `components/kanban/DealDetailSheet.tsx` — `<Sheet />` lateral abre ao clicar no card
- [ ] Campos editáveis inline, botão mover etapa manualmente, link para o lead

### Entregas — Backend

#### Migrations
- [ ] `006_deals.sql` — tabela `deals` + RLS (membro do workspace pode criar/ler/editar)
- [ ] Índices: `workspace_id`, `stage`, `owner_id`, `due_date`

#### Server Actions (`app/(app)/pipeline/actions.ts`)
- [ ] `createDeal(workspaceId, data)` — valida lead pertence ao workspace
- [ ] `updateDealStage(dealId, stage)` — chamado no drop do DnD, com revalidação imediata
- [ ] `updateDeal(dealId, data)` — edição completa
- [ ] `deleteDeal(dealId)` — remoção com confirmação

#### Otimismo no DnD
- [ ] Atualização optimista no cliente (move card imediatamente) + Server Action em background
- [ ] Rollback se Server Action falhar (toast de erro)

#### Queries
- [ ] `lib/queries/deals.ts` — `getDealsByStage(workspaceId)` retorna `Record<DealStage, Deal[]>`

### Commit Final
```
feat: pipeline — kanban board with dnd-kit, deal cards, optimistic stage updates
```

---

## M6 — Dashboard

**Branch:** `feat/dashboard`
**Objetivo:** Página inicial do app autenticado com métricas de vendas, gráfico de funil e lista de negócios com prazo próximo.

### Entregas — Interface primeiro

#### Metric Cards
- [ ] `components/dashboard/MetricCard.tsx` — card com: ícone, label, valor principal, variação percentual (seta verde/vermelha)
- [ ] Quatro cards: Total de Leads, Negócios Abertos, Valor do Pipeline (R$), Taxa de Conversão (%)
- [ ] Skeleton de carregamento para os cards

#### Funil de Vendas
- [ ] `components/dashboard/FunnelChart.tsx` — `"use client"`, Recharts `BarChart` horizontal
- [ ] Eixo X: quantidade de deals por etapa
- [ ] Tooltip customizado com valor em R$ + contagem
- [ ] Cores correspondendo às etapas do pipeline

#### Negócios Próximos
- [ ] `components/dashboard/UpcomingDeals.tsx` — lista de até 5 deals com prazo nos próximos 7 dias
- [ ] Item: título, lead, valor, prazo relativo ("em 2 dias"), link para pipeline
- [ ] Estado vazio se não há deals próximos

#### Layout do Dashboard
- [ ] `app/(app)/dashboard/page.tsx` — Server Component com Suspense para cada seção
- [ ] Grid: 2 colunas no desktop (metric cards + funil | upcoming deals)

### Entregas — Backend

#### Queries (`lib/queries/dashboard.ts`)
- [ ] `getDashboardMetrics(workspaceId)` — total leads, deals abertos, soma de values, taxa de conversão (won/total)
- [ ] `getDealsByStageCount(workspaceId)` — dados para o funil
- [ ] `getUpcomingDeals(workspaceId, userId)` — deals do usuário com due_date nos próximos 7 dias

#### Performance
- [ ] Queries com `Promise.all()` para buscar métricas em paralelo
- [ ] `unstable_cache` do Next.js com revalidação de 60s para métricas do dashboard

### Commit Final
```
feat: dashboard — metric cards, recharts funnel chart, upcoming deals
```

---

## M7 — Monetização

**Branch:** `feat/monetization`
**Objetivo:** Planos Free/Pro com Stripe Checkout, controle de limites, portal de gerenciamento de assinatura e webhook para ativação automática.

### Entregas — Interface primeiro

#### Badge de plano na Sidebar
- [ ] `components/shared/PlanBadge.tsx` — badge "Free" (slate) ou "Pro" (gold) abaixo do WorkspaceSwitcher
- [ ] Link para `/settings/billing`

#### Página de Billing
- [ ] `app/(app)/settings/billing/page.tsx` — cartão com plano atual, data de renovação, botão ação
- [ ] **Se Free:** botão "Fazer upgrade para Pro" → Stripe Checkout
- [ ] **Se Pro:** botão "Gerenciar assinatura" → Stripe Customer Portal
- [ ] Indicadores de uso: leads usados / limite, membros / limite

#### Limite atingido
- [ ] `components/shared/LimitReachedBanner.tsx` — banner no topo das páginas de Leads/Pipeline quando limite Free atingido
- [ ] Modal de upgrade ao tentar criar lead/membro além do limite
- [ ] Hook `useSubscription.ts` — retorna `{ plan, leadsUsed, leadsLimit, membersUsed, membersLimit, isAtLimit }`

### Entregas — Backend

#### Stripe setup
- [ ] Criar produto "PipeFlow Pro" e preço R$49/mês no dashboard Stripe
- [ ] Configurar `lib/stripe.ts` com Stripe SDK singleton
- [ ] Adicionar `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` ao `.env.local`

#### Migrations
- [ ] `007_subscriptions.sql` — tabela `subscriptions` + RLS
- [ ] Adicionar coluna `stripe_customer_id` na tabela `workspaces`

#### Server Actions (`app/(app)/settings/billing/actions.ts`)
- [ ] `createCheckoutSession(workspaceId)` — cria Stripe Checkout Session com `metadata.workspace_id`, redireciona
- [ ] `createCustomerPortalSession(workspaceId)` — cria portal session, redireciona

#### Webhook (`app/api/webhooks/stripe/route.ts`)
- [ ] Verificar assinatura do webhook com `STRIPE_WEBHOOK_SECRET`
- [ ] Handler `checkout.session.completed` → atualiza `subscriptions` para Pro + `workspaces.stripe_customer_id`
- [ ] Handler `customer.subscription.deleted` / `invoice.payment_failed` → rebaixa para Free
- [ ] Handler `invoice.payment_succeeded` → renova `current_period_end`
- [ ] Usar `SUPABASE_SERVICE_ROLE_KEY` apenas aqui (bypass RLS necessário para webhook)

#### Enforcement de limites
- [ ] `createLead()` action — checar `subscriptions.plan` antes de inserir (Free: máx 50)
- [ ] `inviteMember()` action — checar limite de membros (Free: máx 2)

### Commit Final
```
feat: monetization — stripe checkout, webhook subscription sync, plan limits enforcement
```

---

## M8 — Landing Page

**Branch:** `feat/landing`
**Objetivo:** Página pública de marketing para converter visitantes em usuários. Sem backend novo — apenas UI estática + links para auth.

### Entregas

#### Layout público
- [ ] `app/(marketing)/layout.tsx` — navbar pública + footer
- [ ] `components/marketing/Navbar.tsx` — logo, links (Features, Pricing), botões "Entrar" e "Começar grátis"

#### Sections da Landing Page (`app/page.tsx`)
- [ ] **Hero** — headline principal, subheadline, CTA "Começar grátis" (→ `/signup`), screenshot/mockup do dashboard
- [ ] **Problema/Solução** — 3 cards: dor do usuário vs solução do PipeFlow
- [ ] **Features** — 6 funcionalidades em grid: Kanban, Leads, Dashboard, Multi-workspace, Atividades, Segurança
- [ ] **Social proof** — seção de depoimentos (placeholder com 3 testemunhos mockados)
- [ ] **Pricing** — 2 cards: Free e Pro, tabela comparativa, botão de CTA em cada card
- [ ] **CTA final** — banner de conversão com headline + botão "Criar conta gratuita"
- [ ] **Footer** — logo, links, copyright

#### Qualidade
- [ ] Responsivo em mobile, tablet e desktop
- [ ] Meta tags Open Graph (`title`, `description`, `og:image`)
- [ ] Favicon PipeFlow
- [ ] `next/image` para todas as imagens (LCP otimizado)

### Commit Final
```
feat: landing page — hero, features, pricing, cta, responsive marketing layout
```

---

## M9 — Polish & Deploy

**Branch:** `feat/polish`
**Objetivo:** Refinar a experiência, corrigir edge cases, auditar segurança RLS e fazer o deploy em produção na Vercel.

### Entregas — UX

#### Loading states
- [ ] Skeleton em todas as listas (leads, deals, dashboard)
- [ ] Spinner nos botões de submit de formulários
- [ ] `loading.tsx` em todas as rotas do App Router

#### Error handling
- [ ] `error.tsx` em todas as rotas — página de erro amigável com botão "Tentar novamente"
- [ ] `not-found.tsx` — 404 customizado
- [ ] Toast de sucesso/erro em todas as Server Actions (usando `sonner` ou shadcn `toast`)

#### Empty states
- [ ] Leads: zero leads → ilustração + "Crie seu primeiro lead"
- [ ] Pipeline: zero deals → "Arraste um lead para cá ou crie um deal"
- [ ] Dashboard: workspace novo → dicas de primeiros passos

#### Acessibilidade
- [ ] Todos os formulários com `aria-label` e associação `htmlFor`/`id`
- [ ] Foco visível nos elementos interativos
- [ ] Contraste de cores verificado (WCAG AA)

### Entregas — Segurança

#### Auditoria de RLS
- [ ] Verificar policy de cada tabela: `workspaces`, `workspace_members`, `invites`, `leads`, `deals`, `activities`, `subscriptions`
- [ ] Confirmar que nenhuma query de Server Component usa `service_role` sem necessidade
- [ ] Testar isolamento: usuário de workspace A não deve ver dados do workspace B

#### Validação
- [ ] Todos os inputs de Server Actions validados com `zod` no servidor
- [ ] Sanitização de slugs de workspace (slugify)
- [ ] Rate limiting básico no endpoint de invite

### Entregas — Deploy

#### Vercel
- [ ] Criar projeto no Vercel apontando para repositório GitHub
- [ ] Configurar todas as variáveis de ambiente em `vercel env add`
- [ ] Testar build de produção localmente com `npm run build`
- [ ] Configurar domínio customizado (se disponível)
- [ ] Habilitar Vercel Analytics

#### Supabase produção
- [ ] Criar projeto Supabase de produção (separado do dev)
- [ ] Rodar todas as migrations em produção
- [ ] Configurar URL de redirect de auth para domínio de produção
- [ ] Ativar PITR (Point-in-Time Recovery) se plano Pro

#### Stripe produção
- [ ] Ativar conta Stripe para modo live
- [ ] Criar produto/preço em modo live
- [ ] Registrar webhook de produção no dashboard Stripe
- [ ] Testar fluxo de checkout completo em produção

#### Smoke tests pós-deploy
- [ ] [ ] Criar conta → onboarding → criar workspace
- [ ] [ ] Convidar membro → aceitar via e-mail → logar como membro
- [ ] [ ] Criar lead → mover para pipeline → registrar atividade
- [ ] [ ] Upgrade para Pro → verificar limites removidos
- [ ] [ ] Cancelar assinatura → verificar rebaixamento para Free

### Commit Final
```
feat: polish & deploy — skeletons, error boundaries, RLS audit, vercel production deploy
```

---

## Resumo dos Milestones

| # | Nome | Branch | Foco |
|---|---|---|---|
| M0 | Scaffold | `feat/scaffold` | Setup do projeto |
| M1 | Design System | `feat/design-system` | Shell visual + navegação |
| M2 | Autenticação | `feat/auth` | Login, registro, middleware |
| M3 | Workspace | `feat/workspace` | Multi-empresa, convites, onboarding |
| M4 | Leads | `feat/leads` | CRUD + timeline de atividades |
| M5 | Pipeline | `feat/pipeline` | Kanban DnD + deals |
| M6 | Dashboard | `feat/dashboard` | Métricas + gráfico de funil |
| M7 | Monetização | `feat/monetization` | Stripe + limites de plano |
| M8 | Landing Page | `feat/landing` | Marketing público |
| M9 | Polish & Deploy | `feat/polish` | Qualidade + produção |

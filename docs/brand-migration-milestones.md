# Migração de Brand: PipeFlow CRM → Revon Studio CRM

Checklist de acompanhamento da transição de identidade visual. Plano completo de referência: ver histórico de planejamento da sessão (mapa de cores, tabela de estágios, riscos). Cada milestone é entregue, revisado e marcado antes de avançar para o próximo.

> Status geral: 🔴 não iniciado · 🟡 em andamento · 🟢 concluído

---

## M1 — Fundação: fontes e variáveis CSS 🟢

- [x] `src/app/layout.tsx`: trocar Syne/DM Sans/IBM Plex Mono → Inter/JetBrains Mono; atualizar `metadata.title` para "Revon Studio CRM"
- [x] `src/app/globals.css`: renomear tokens `--color-pf-*` → `--color-crm-*`/`--color-night-*`; atualizar valores em `:root`/`.dark`; trocar fallbacks de fonte; ajustar `.deal-card-inner` e scrollbars
- [x] `src/components/kanban/kanban-board.tsx`: atualizar `STAGE_CONFIG` com nova paleta de estágios
- [x] **Checkpoint**: `npm run dev`, abrir `/dashboard` e `/pipeline` — validado via curl (307 redirect para `/login` sem sessão, como esperado) e CSS compilado confirma fontes Inter/JetBrains Mono ativas, sem rastro de Syne/DM Sans/IBM Plex Mono

## M2 — Substituição de hex hardcoded 🔴

- [ ] `src/lib/mock/metrics.ts`
- [ ] Dashboard (funnel-chart, lead-deal-metric-card, metric-card, metric-cards-grid, pending-tasks, upcoming-deals)
- [ ] Kanban (deal-card, deal-form-dialog, kanban-column, lost-reason-dialog, pipeline-client)
- [ ] Layout (sidebar, navbar, workspace-switcher)
- [ ] Auth (login-form, register-form, workspace-form, páginas `(auth)/*`) — incluindo legado `#4F8EF7`/`#1B2559`
- [ ] Onboarding (`(onboarding)/onboarding/page.tsx`)
- [ ] Settings/billing (`(app)/settings/billing/page.tsx`)
- [ ] Landing page (`(marketing)/page.tsx`, landing/navbar, landing/stat-counter)
- [ ] Email template (`src/emails/workspace-invite.tsx`)
- [ ] **Checkpoint**: grep por todos os hex antigos em `src/` retorna zero resultados

## M3 — Strings de marca e metadata 🔴

- [ ] Metadata titles (auth pages, marketing layout, onboarding)
- [ ] Wordmark visual (auth layout, landing navbar, sidebar — com contraste de peso 900/300)
- [ ] Mensagens de boas-vindas (login-form, billing page)
- [ ] Email de convite (`workspace-invite.tsx`, `lib/actions/workspaces.ts`)
- [ ] **Checkpoint**: grep por "PipeFlow" em `src/` retorna zero resultados

## M4 — Assets (logo, favicon, package.json) 🔴

- [ ] Mover `Logo CRM.png` para `public/`
- [ ] Aplicar logo na sidebar, auth layout, landing navbar
- [ ] Gerar favicon derivado do logo, substituir `src/app/favicon.ico`
- [ ] `package.json`: `"pipeflow-crm"` → `"revon-studio-crm"`

## M5 — QA visual e regressão final 🔴

- [ ] `npm run build` sem erros de tipo
- [ ] Navegação manual por todas as rotas (login, register, forgot-password, onboarding, dashboard, leads, leads/[id], pipeline com drag-and-drop, settings/workspace, settings/billing, landing)
- [ ] Verificar hover de deal-card, gráfico de funil, scrollbars, prefers-reduced-motion
- [ ] Grep final de regressão: zero hex antigo, zero "PipeFlow", zero Syne/DM Sans/IBM Plex Mono
- [ ] Atualizar `CLAUDE.md` do projeto com a nova paleta/identidade

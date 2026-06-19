# Migração de Brand: PipeFlow CRM → Revon Studio CRM

Checklist de acompanhamento da transição de identidade visual. Plano completo de referência: ver histórico de planejamento da sessão (mapa de cores, tabela de estágios, riscos). Cada milestone é entregue, revisado e marcado antes de avançar para o próximo.

> Status geral: 🔴 não iniciado · 🟡 em andamento · 🟢 concluído

---

## M1 — Fundação: fontes e variáveis CSS 🟢

- [x] `src/app/layout.tsx`: trocar Syne/DM Sans/IBM Plex Mono → Inter/JetBrains Mono; atualizar `metadata.title` para "Revon Studio CRM"
- [x] `src/app/globals.css`: renomear tokens `--color-pf-*` → `--color-crm-*`/`--color-night-*`; atualizar valores em `:root`/`.dark`; trocar fallbacks de fonte; ajustar `.deal-card-inner` e scrollbars
- [x] `src/components/kanban/kanban-board.tsx`: atualizar `STAGE_CONFIG` com nova paleta de estágios
- [x] **Checkpoint**: `npm run dev`, abrir `/dashboard` e `/pipeline` — validado via curl (307 redirect para `/login` sem sessão, como esperado) e CSS compilado confirma fontes Inter/JetBrains Mono ativas, sem rastro de Syne/DM Sans/IBM Plex Mono

## M2 — Substituição de hex hardcoded 🟢

- [x] `src/lib/mock/metrics.ts`
- [x] Dashboard (funnel-chart, lead-deal-metric-card, metric-card, metric-cards-grid, pending-tasks, upcoming-deals)
- [x] Kanban (deal-card, deal-form-dialog, kanban-column, lost-reason-dialog, pipeline-client)
- [x] Layout (sidebar, mobile-sidebar, navbar, workspace-switcher)
- [x] Auth (login-form, register-form, workspace-form, páginas `(auth)/*`) — incluindo legado `#4F8EF7`/`#1B2559`
- [x] Onboarding (`(onboarding)/onboarding/page.tsx`)
- [x] Settings (billing, workspace, invite-member-dialog, members-list)
- [x] Landing page (`(marketing)/page.tsx`, landing/navbar, landing/stat-counter)
- [x] Email template (`src/emails/workspace-invite.tsx`) — também trocado texto "PipeFlow" → "Revon Studio CRM" neste arquivo
- [x] **Escopo adicional descoberto durante a execução**: havia uma segunda paleta legada não documentada no plano original ("lime/charcoal" — `#CAFF33`, `#0A0A0A`/`#0C0C0E`/`#141416`, cinzas `#E8E8E8`/`#8A8A8F`/`#555559`, stage colors `#5B7FFF`/`#00B4D8`/`#2ED573`/`#FF6B35`/`#FF4757`) espalhada por 27 arquivos. Migrada para os tokens `crm-*` (Fox Fire) junto com o escopo original.
- [x] **Checkpoint**: `grep -rn -E "#1B2559|#4F8EF7|#22C55E|#EF4444|#F8FAFC|#CAFF33|#0A0A0A|#0C0C0E|#141416|#E8E8E8|#8A8A8F|#555559|#5B7FFF|#00B4D8|#2ED573|#FF6B35|#FF4757" src/` retorna zero resultados; `npm run build` passa sem erros de tipo (18 rotas)

## M3 — Strings de marca e metadata 🟢

- [x] Metadata titles (auth pages, marketing layout, onboarding)
- [x] Wordmark visual (auth layout, landing navbar, sidebar — com contraste de peso 900/300: "Revon" black + "Studio CRM" light uppercase)
- [x] Mensagens de boas-vindas (login-form, billing page)
- [x] Email de convite (`lib/actions/workspaces.ts` — `from`/`subject`; template `workspace-invite.tsx` já trocado no M2)
- [x] **Checkpoint**: `grep -rn "PipeFlow" src/` retorna zero resultados; `npm run build` passa sem erros de tipo (18 rotas)

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

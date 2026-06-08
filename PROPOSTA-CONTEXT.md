# Proposta Comercial — Contexto do Projeto

## O que é

Sistema de propostas comerciais da Revon Labs, integrado ao site principal (`revon-site`).
Permite criar, personalizar, enviar e rastrear propostas comerciais para clientes.

---

## Status atual

- [x] Template HTML da proposta criado e funcionando
- [x] Deploy no Vercel via repositório `revon-site` (GitHub: `revonlabs/revon-site`)
- [x] Rota protegida por senha em `revonlabs.com.br/proposta`
- [x] Middleware de autenticação com cookie httpOnly (30 dias)
- [x] Tela de login com identidade visual da Revon Labs
- [x] Integração com Supabase (tabela `propostas` no projeto CRM)
- [x] Geração de link único por cliente (`/p/[slug]`)
- [x] Rastreio de abertura + notificação por email (via Resend)
- [x] Seção ROI fixa para o cliente, editável por Pedro no modal
- [ ] Vincular proposta ao CRM (próximo passo)
- [ ] Painel de propostas enviadas (`/proposta/enviadas`)

---

## Arquivos criados no revon-site

```
middleware.ts                          — intercepta /proposta, redireciona para login se não autenticado
next.config.ts                         — adicionado outputFileTracingIncludes para incluir proposta/index.html no build
proposta/index.html                    — template HTML completo da proposta (fonte da verdade)
app/proposta/route.ts                  — Route Handler que serve o HTML do template
app/proposta/login/page.tsx            — tela de login com identidade visual da Revon
app/api/proposta-login/route.ts        — API que valida senha e seta cookie httpOnly
lib/supabase.ts                        — cliente Supabase admin (service_role, lazy init)
app/api/proposta-salvar/route.ts       — salva proposta no Supabase, gera slug único
app/api/proposta-track/route.ts        — registra abertura + envia email via Resend
app/p/[slug]/route.ts                  — rota pública do cliente, injeta state no template
```

---

## Variáveis de ambiente necessárias

Configuradas em Vercel → Settings → Environment Variables e em `.env.local`:

```
PROPOSTA_SENHA=<senha definida por Pedro>
SUPABASE_URL=https://bxuocbcsqayxfjhmorlw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role key do projeto CRM>
```

**Atenção:** usar sempre `SUPABASE_SERVICE_ROLE_KEY` (não a anon key) — a rota de salvar
proposta roda server-side e precisa bypassar RLS para inserir.

---

## Banco de dados — Supabase

**Projeto:** CRM da Revon Labs (compartilhado, não exclusivo)
**URL:** `https://bxuocbcsqayxfjhmorlw.supabase.co`

A ideia de usar o projeto do CRM é intencional: propostas geradas podem virar leads
gerenciados diretamente no CRM.

### Tabela a criar (ainda não criada)

Rodar no SQL Editor do Supabase:

```sql
create table propostas (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  cliente text,
  dados jsonb not null,
  criada_em timestamptz default now(),
  aberta_em timestamptz,
  total_aberturas int default 0
);
```

---

## Arquivos a criar (próximos passos)

```
app/proposta/enviadas/page.tsx         — painel: lista de propostas enviadas, status de abertura
```

---

## Fluxo completo

1. Pedro acessa `revonlabs.com.br/proposta` → já autenticado via cookie (30 dias)
2. Preenche os dados do cliente no modal "Editar Proposta" (incluindo campos de ROI)
3. Clica em **"Gerar Link"** → `state` salvo no Supabase com slug único (ex: `abc123`)
4. Modal exibe `revonlabs.com.br/p/abc123` com botão copiar
5. Cliente abre o link → vê a proposta em modo leitura (ROI fixo, sem editor)
6. Na abertura: Supabase registra `aberta_em` e `total_aberturas`, Resend envia email para Pedro
7. **Próximo:** vincular proposta ao CRM (tabela `leads` ou `deals` do mesmo Supabase)
8. **Próximo:** Pedro acessa `revonlabs.com.br/proposta/enviadas` → lista de propostas e status

---

## Stack técnica

| Componente | Tecnologia |
|------------|------------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Hospedagem | Vercel (deploy automático via push no GitHub) |
| Banco de dados | Supabase (projeto CRM existente) |
| Email (notificações) | Resend (já configurado no projeto) |
| Autenticação interna | Cookie httpOnly + middleware Next.js |
| Repositório | github.com/revonlabs/revon-site |

---

## Identidade visual

Toda UI segue o brand system da Revon Labs definido em `/Users/pedronezello/Documents/RevonLabs/CLAUDE.md`:
- Fundo: Night Deep `#060B14`
- Gradiente aurora: `#3BFFA0 → #00D4AA → #4A90E2 → #7E57C2 → #CE59B2`
- Fontes: Syne (títulos) + DM Sans (corpo) + JetBrains Mono (código/labels)
- Sem modo claro — sempre dark

---

## Observações importantes

- O template `proposta/index.html` é o arquivo editado diretamente para atualizar a proposta.
  Após qualquer alteração, fazer push no GitHub para o Vercel pegar automaticamente.
- O middleware protege apenas rotas sob `/proposta`. A rota `/p/[slug]` é pública (acesso do cliente).
- Resend já está instalado e configurado no projeto via `lib/resend.ts`.
- A pasta `revon-proposta/` criada em `/Users/pedronezello/Documents/RevonLabs/` é obsoleta —
  pode ser deletada, o projeto foi integrado diretamente ao `revon-site`.

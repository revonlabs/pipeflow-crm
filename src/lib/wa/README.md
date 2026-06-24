# Módulo WhatsApp Monitor — Criptografia

`content_text` e `media_url` (`wa_messages`) e `profile_pic_url` (`wa_contacts`)
são PII e ficam cifrados em repouso (pgcrypto). Nenhum dado real deve entrar
nessas colunas sem isso — ver migrations `024_wa_pgcrypto_functions.sql` e
`025_wa_encrypt_columns.sql`.

## WA_MASTER_KEY

Variável de ambiente obrigatória, sem default. Vive **só** na Vercel (env var
do projeto), nunca no Supabase Vault e nunca no código ou em `.env` versionado.

Gerar um valor novo:

```bash
openssl rand -base64 32
```

Configurar na Vercel (ambiente de produção e preview, com valores diferentes):

```bash
vercel env add WA_MASTER_KEY production
vercel env add WA_MASTER_KEY preview
```

Sem `WA_MASTER_KEY` definida, `src/lib/wa/crypto.ts` lança `wa_master_key_missing`
antes de qualquer chamada ao banco.

## Como funciona

- **Derivação por workspace:** a master key nunca cifra nada diretamente. Cada
  workspace usa uma subchave derivada via HMAC-SHA256(master_key, workspace_id
  + key_version), calculada dentro do Postgres (`wa_derive_workspace_key`).
- **Master key nunca em SET LOCAL:** o CRM acessa o Postgres via PostgREST
  (cliente Supabase HTTP, stateless) — cada chamada é sua própria transação
  implícita, então `SET LOCAL` não atravessa chamadas separadas. Por isso a
  master key é passada como **parâmetro da função RPC**
  (`wa_encrypt_content_rpc` / `wa_decrypt_content_rpc`), sempre no body da
  requisição `.rpc()`, nunca em querystring/URL.
- **Funções SECURITY DEFINER:** `wa_encrypt_content_rpc`/`wa_decrypt_content_rpc`
  são as únicas entradas expostas a `authenticated`/`service_role`. Encapsulam
  a derivação de subchave e o `pgp_sym_encrypt`/`pgp_sym_decrypt` (pgcrypto).
  Toda exceção interna é convertida em `wa_crypto_error` genérico — nenhum erro
  do Postgres ecoa a master key, o texto puro ou qualquer parâmetro de entrada.
- **RLS continua sendo a única porta de entrada para o dado:** as RPCs não
  fazem `SELECT` nas tabelas `wa_*`; elas só operam sobre o bytea/texto que o
  caller já obteve (e que já passou pela policy de `is_workspace_admin`).
- **Uso em TypeScript:** sempre via `src/lib/wa/crypto.ts`
  (`encryptWaContent`/`decryptWaContent`). Nunca ler/escrever `content_text`,
  `media_url` ou `profile_pic_url` cru — essas colunas são `bytea` no banco.

## Rotação da master key (não implementada — registrar antes de fazer)

Rotacionar a master key invalida todas as subchaves derivadas dela. Não é uma
troca instantânea: requer um job de backfill que decifra com a master key
antiga e recifra com a nova, linha a linha, atualizando `key_version`. Esse
job ainda não existe — qualquer rotação real precisa ser planejada como tarefa
própria, com a master key antiga preservada até 100% das linhas migrarem.

## Dívida técnica conhecida

Sem busca full-text sobre `content_text` (índice `content_text_search` não
existe): com o conteúdo cifrado, um índice TSVECTOR sobre texto puro não é
possível. Decidir busca client-side pós-decrypt vs. campo derivado fica para
quando a ingestão (Sprint 1) tiver volume real para justificar a decisão.

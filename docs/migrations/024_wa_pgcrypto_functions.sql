-- Migration 024: WhatsApp Monitor — criptografia em repouso (pgcrypto)
-- Bloqueador do Sprint 1 (ver wa-pgcrypto-sprint1-blocker): content_text e
-- media_url são PII (LGPD) e precisam estar cifrados antes de qualquer dado
-- real de produção entrar nas tabelas wa_*.
--
-- Desenho:
-- - Uma master key por ambiente, NUNCA no banco/código: env var WA_MASTER_KEY
--   na Vercel.
-- - O CRM acessa o Postgres via PostgREST (cliente Supabase HTTP, stateless —
--   cada chamada é sua própria transação implícita). Por isso `SET LOCAL` não
--   atravessa chamadas: a master key é passada como PARÂMETRO da função RPC
--   (wa_encrypt_content_rpc/wa_decrypt_content_rpc), dentro do body da
--   requisição (.rpc() do supabase-js), nunca em querystring/URL.
-- - HKDF deriva uma subchave por workspace a partir da master key + workspace_id
--   dentro da própria função SECURITY DEFINER — a master key nunca é persistida,
--   só passa pela memória da transação da chamada.
-- - Funções "_rpc" tratam toda exceção com mensagem genérica (sem refletir
--   parâmetros): nenhum erro do Postgres deve ecoar a master key ou o texto puro.
-- - key_version (coluna nas tabelas com dado cifrado) suporta rotação futura:
--   rotacionar a master key implica re-cifrar linha a linha (não é instantâneo);
--   key_version marca com qual versão da master key cada linha foi cifrada.
--
-- Idempotente: CREATE OR REPLACE / CREATE EXTENSION IF NOT EXISTS.

SET search_path = '';

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ─── derivação de subchave por workspace (HKDF simplificado via HMAC-SHA256) ──
-- Função interna, nunca exposta a authenticated (sem GRANT). Só chamada pelas
-- funções _rpc abaixo, como SECURITY DEFINER (dono da função, não o caller).
CREATE OR REPLACE FUNCTION public.wa_derive_workspace_key(p_workspace_id UUID, p_key_version INTEGER, p_master_key TEXT)
RETURNS BYTEA
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_master_key IS NULL OR p_master_key = '' THEN
    RAISE EXCEPTION 'wa_crypto_error';
  END IF;

  -- HKDF-Expand simplificado: HMAC-SHA256(master_key, workspace_id || key_version)
  -- como subchave de 32 bytes. Suficiente para derivação determinística por
  -- workspace; não reusa a master key diretamente em nenhuma cifra.
  RETURN extensions.hmac(
    p_workspace_id::TEXT || ':' || p_key_version::TEXT,
    p_master_key,
    'sha256'
  );
END;
$$;

-- REVOKE ALL FROM PUBLIC não basta: o Supabase tem ALTER DEFAULT PRIVILEGES
-- que concede EXECUTE em toda função nova de public para anon/authenticated/
-- service_role automaticamente (grant por role, não via PUBLIC). Por isso
-- cada função abaixo tem REVOKE explícito também de anon/authenticated/
-- service_role, deixando o EXECUTE só para o dono (postgres), exceto nas
-- wrappers "_rpc" no final do arquivo, que são a única entrada exposta.
REVOKE ALL ON FUNCTION public.wa_derive_workspace_key(UUID, INTEGER, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_derive_workspace_key(UUID, INTEGER, TEXT) FROM anon, authenticated, service_role;

-- ─── encrypt/decrypt internos (usados pelas migrations de backfill) ────────

CREATE OR REPLACE FUNCTION public.wa_encrypt_content(p_plaintext TEXT, p_workspace_id UUID, p_key_version INTEGER, p_master_key TEXT)
RETURNS BYTEA
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_subkey BYTEA;
BEGIN
  IF p_plaintext IS NULL THEN
    RETURN NULL;
  END IF;

  v_subkey := public.wa_derive_workspace_key(p_workspace_id, p_key_version, p_master_key);
  RETURN extensions.pgp_sym_encrypt(p_plaintext, encode(v_subkey, 'hex'));
END;
$$;

CREATE OR REPLACE FUNCTION public.wa_decrypt_content(p_ciphertext BYTEA, p_workspace_id UUID, p_key_version INTEGER, p_master_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_subkey BYTEA;
BEGIN
  IF p_ciphertext IS NULL THEN
    RETURN NULL;
  END IF;

  v_subkey := public.wa_derive_workspace_key(p_workspace_id, p_key_version, p_master_key);
  RETURN extensions.pgp_sym_decrypt(p_ciphertext, encode(v_subkey, 'hex'));
END;
$$;

REVOKE ALL ON FUNCTION public.wa_encrypt_content(TEXT, UUID, INTEGER, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.wa_decrypt_content(BYTEA, UUID, INTEGER, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_encrypt_content(TEXT, UUID, INTEGER, TEXT) FROM anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.wa_decrypt_content(BYTEA, UUID, INTEGER, TEXT) FROM anon, authenticated, service_role;
-- Sem GRANT para authenticated/service_role: só chamadas pelas wrappers "_rpc"
-- abaixo (mesmo dono, SECURITY DEFINER) ou por outras migrations de backfill.

-- ─── wrappers RPC — únicas entradas expostas a authenticated/service_role ──
-- Tratam toda exceção com mensagem genérica: nunca refletem master_key,
-- texto puro ou qualquer parâmetro de entrada na mensagem de erro.

CREATE OR REPLACE FUNCTION public.wa_encrypt_content_rpc(
  p_plaintext TEXT, p_workspace_id UUID, p_key_version INTEGER, p_master_key TEXT
)
RETURNS BYTEA
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN public.wa_encrypt_content(p_plaintext, p_workspace_id, p_key_version, p_master_key);
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'wa_crypto_error';
END;
$$;

CREATE OR REPLACE FUNCTION public.wa_decrypt_content_rpc(
  p_ciphertext BYTEA, p_workspace_id UUID, p_key_version INTEGER, p_master_key TEXT
)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN public.wa_decrypt_content(p_ciphertext, p_workspace_id, p_key_version, p_master_key);
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'wa_crypto_error';
END;
$$;

REVOKE ALL ON FUNCTION public.wa_encrypt_content_rpc(TEXT, UUID, INTEGER, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.wa_decrypt_content_rpc(BYTEA, UUID, INTEGER, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wa_encrypt_content_rpc(TEXT, UUID, INTEGER, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.wa_decrypt_content_rpc(BYTEA, UUID, INTEGER, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.wa_encrypt_content_rpc(TEXT, UUID, INTEGER, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.wa_decrypt_content_rpc(BYTEA, UUID, INTEGER, TEXT) TO authenticated, service_role;

-- RLS nas tabelas wa_messages/wa_contacts (migration 023) continua sendo a
-- única porta de entrada de dado: mesmo com EXECUTE liberado nas RPCs, o
-- caller só decifra valores que ele já tinha lido via SELECT (que passa por
-- RLS). As RPCs não fazem SELECT nas tabelas — só operam sobre o bytea/texto
-- que o caller já possui.

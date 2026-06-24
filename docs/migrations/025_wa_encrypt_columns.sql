-- Migration 025: WhatsApp Monitor — migra colunas sensíveis para bytea cifrado
-- Continuação da 024. Nenhum dado real existe ainda nessas tabelas (Sprint 1
-- ainda não tem ingestão), então a migração de colunas é puramente estrutural:
-- não há linha existente para re-cifrar, então o ALTER COLUMN troca o tipo
-- sem precisar (e sem poder, já que as funções de cifra exigem master_key
-- como parâmetro, indisponível em uma migration SQL estática) chamar
-- wa_encrypt_content_rpc. Se este arquivo for rodado num banco que já tenha
-- linhas reais, o ALTER abaixo falha de propósito — backfill de dado real
-- exige rodar uma migration de dados em lote separada, fora deste arquivo,
-- com a master key disponível no ambiente que a executa.
--
-- content_text (wa_messages), media_url (wa_messages) e profile_pic_url
-- (wa_contacts, contém URL com possível PII) passam de TEXT para BYTEA cifrado.
-- key_version acompanha cada linha para suportar rotação futura da master key.
--
-- Idempotente: checagem de existência de coluna antes de alterar.

SET search_path = '';

-- ─── wa_messages ────────────────────────────────────────────────────────────

ALTER TABLE public.wa_messages
  ADD COLUMN IF NOT EXISTS key_version INTEGER NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.wa_messages) > 0 THEN
    RAISE EXCEPTION 'wa_messages tem linhas existentes — rode o backfill de dados com WA_MASTER_KEY antes desta migration estrutural';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wa_messages'
      AND column_name = 'content_text' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.wa_messages ALTER COLUMN content_text TYPE BYTEA USING NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wa_messages'
      AND column_name = 'media_url' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.wa_messages ALTER COLUMN media_url TYPE BYTEA USING NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.wa_messages.content_text IS
  'Cifrado via pgcrypto (wa_encrypt_content/wa_decrypt_content). Nunca ler/escrever cru.';
COMMENT ON COLUMN public.wa_messages.media_url IS
  'Cifrado via pgcrypto (wa_encrypt_content/wa_decrypt_content). Nunca ler/escrever cru.';

-- ─── wa_contacts ────────────────────────────────────────────────────────────

ALTER TABLE public.wa_contacts
  ADD COLUMN IF NOT EXISTS key_version INTEGER NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.wa_contacts) > 0 THEN
    RAISE EXCEPTION 'wa_contacts tem linhas existentes — rode o backfill de dados com WA_MASTER_KEY antes desta migration estrutural';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wa_contacts'
      AND column_name = 'profile_pic_url' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.wa_contacts ALTER COLUMN profile_pic_url TYPE BYTEA USING NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.wa_contacts.profile_pic_url IS
  'Cifrado via pgcrypto (wa_encrypt_content/wa_decrypt_content). Nunca ler/escrever cru.';

-- DÍVIDA TÉCNICA (registrada na 022): sem content_text_search (TSVECTOR).
-- Com content_text agora cifrado, índice de full-text sobre texto puro não é
-- possível — segue para Sprint 1 decidir busca client-side pós-decrypt vs.
-- campo derivado. Não resolvido nesta migration.

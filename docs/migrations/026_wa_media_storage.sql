-- Migration 026: WhatsApp Monitor — Supabase Storage para mídia
-- A Evolution API envia mídia (imagem/áudio/vídeo/documento) em base64 inline
-- no payload do webhook, não só uma URL. A URL do WhatsApp (data.message.*.url)
-- expira e exige a mediaKey do protocolo pra decriptar — não serve como
-- referência persistente. O worker (Sprint 1, ainda a implementar) decodifica
-- o base64 e faz upload para este bucket; media_url (wa_messages, já bytea
-- cifrado via pgcrypto — migration 025) passa a guardar o path interno do
-- Storage, não a URL do WhatsApp nem o base64 bruto.
--
-- Bucket único (não um por workspace): evita multiplicar objetos de infra a
-- cada novo workspace. Isolamento via RLS em storage.objects, comparando o
-- primeiro segmento do path (workspace_id) com is_workspace_admin — mesmo
-- padrão já usado em todas as tabelas wa_* (migration 023).
--
-- Path: wa-media/{workspace_id}/{instance_id}/{evolution_message_id}.{ext}
--
-- Idempotente: ON CONFLICT DO NOTHING para o bucket, DROP POLICY IF EXISTS
-- antes de recriar.

SET search_path = '';

INSERT INTO storage.buckets (id, name, public)
VALUES ('wa-media', 'wa-media', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "wa_media_select" ON storage.objects;
DROP POLICY IF EXISTS "wa_media_insert" ON storage.objects;
DROP POLICY IF EXISTS "wa_media_delete" ON storage.objects;

-- (storage.foldername(name))[1] é o primeiro segmento do path — o workspace_id.
-- Cast explícito pra uuid: foldername retorna text[], is_workspace_admin espera uuid.
CREATE POLICY "wa_media_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'wa-media'
    AND public.is_workspace_admin(((storage.foldername(name))[1])::uuid)
  );

-- INSERT por authenticated cobre upload feito por Server Action (ex: reenvio
-- manual futuro). O worker de ingestão (Sprint 1) usa service_role, que tem
-- acesso irrestrito ao Storage por padrão — sem policy own para service_role.
CREATE POLICY "wa_media_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'wa-media'
    AND public.is_workspace_admin(((storage.foldername(name))[1])::uuid)
  );

-- Sem DELETE: mídia segue a mesma regra de retenção de wa_messages (não se
-- apagam — ver migration 023). Remoção real (LGPD, direito ao esquecimento)
-- é tarefa própria, fora deste arquivo.

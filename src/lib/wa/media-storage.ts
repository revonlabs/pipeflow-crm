import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const EXTENSION_BY_MIMETYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "video/mp4": "mp4",
  "application/pdf": "pdf",
};

function extensionFor(mimetype: string): string {
  return EXTENSION_BY_MIMETYPE[mimetype] ?? "bin";
}

export interface UploadWaMediaInput {
  workspaceId: string;
  instanceId: string;
  evolutionMessageId: string;
  base64: string;
  mimetype: string;
}

// Decodifica o base64 recebido da Evolution e faz upload pro bucket
// privado wa-media. Path: {workspace_id}/{instance_id}/{evolution_message_id}.{ext}
// — mesmo prefixo que a RLS de storage.objects espera (migration 026).
// Retorna o path interno (não a URL pública — o bucket é privado).
export async function uploadWaMedia(
  supabase: SupabaseClient<Database>,
  input: UploadWaMediaInput
): Promise<string> {
  const ext = extensionFor(input.mimetype);
  const path = `${input.workspaceId}/${input.instanceId}/${input.evolutionMessageId}.${ext}`;

  const buffer = Buffer.from(input.base64, "base64");

  const { error } = await supabase.storage.from("wa-media").upload(path, buffer, {
    contentType: input.mimetype,
    upsert: false,
  });

  if (error) {
    throw new Error("wa_media_upload_failed");
  }

  return path;
}

// Deleta o arquivo físico do bucket wa-media. Usado pelo worker de retenção
// (Sprint 6) para mídia > 30 dias ou de contatos anonimizados há > 30 dias.
// O path deve ser o valor já descriptografado de wa_messages.media_url.
export async function deleteWaMedia(supabase: SupabaseClient<Database>, path: string): Promise<void> {
  const { error } = await supabase.storage.from("wa-media").remove([path]);

  if (error) {
    throw new Error("wa_media_delete_failed");
  }
}

import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptWaContent } from "@/lib/wa/crypto";
import { deleteWaMedia } from "@/lib/wa/media-storage";
import { waLogger } from "@/lib/wa/logger";

// Worker de retenção — chamado por pg_cron via pg_net, uma vez por mês (dia 1,
// 3h). Protegido por WA_WORKER_SECRET, mesmo padrão de process-queue.
//
// Três etapas independentes, cada uma tolerante a falha das outras:
// 1. Arquivamento de mensagens > 90 dias (wa_archive_old_messages, SQL puro).
// 2. Limpeza física de mídia > 30 dias (mídia "normal", não ligada a
//    anonimização) — limitada a MEDIA_BATCH_LIMIT por execução.
// 3. Purga de mídia de contatos anonimizados há > 30 dias — mesmo limite,
//    orçamento próprio (não soma com a etapa 2) para manter o total da
//    execução previsível.
//
// media_url vem cifrado do banco (BYTEA); é preciso descriptografar para
// obter o path real no bucket antes de chamar deleteWaMedia().
const MEDIA_BATCH_LIMIT = 200;

interface ExpirableMediaRow {
  message_id: string;
  workspace_id: string;
  key_version: number;
  media_url: string;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.WA_WORKER_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  const archived = await runArchiving(supabase);
  const mediaCleaned = await runMediaCleanup(supabase);
  const contactsPurged = await runAnonymizedContactsPurge(supabase);

  return NextResponse.json({
    archived,
    media_cleaned: mediaCleaned,
    contacts_purged: contactsPurged,
  });
}

async function runArchiving(supabase: ReturnType<typeof getSupabaseAdminClient>): Promise<number> {
  const { data, error } = await supabase.rpc("wa_archive_old_messages");

  if (error) {
    waLogger.error("wa_retention_archive_failed");
    return 0;
  }

  const archivedCount = data?.[0]?.archived_count ?? 0;
  waLogger.info("wa_retention_archive_done", { archivedCount });
  return archivedCount;
}

async function runMediaCleanup(supabase: ReturnType<typeof getSupabaseAdminClient>): Promise<number> {
  const { data: rows, error } = await supabase.rpc("wa_select_expirable_media", {
    p_limit: MEDIA_BATCH_LIMIT,
  });

  if (error) {
    waLogger.error("wa_retention_select_expirable_media_failed");
    return 0;
  }

  return deleteAndMarkMedia(supabase, rows ?? []);
}

async function runAnonymizedContactsPurge(
  supabase: ReturnType<typeof getSupabaseAdminClient>
): Promise<number> {
  const { data: rows, error } = await supabase.rpc("wa_purge_anonymized_contacts", {
    p_limit: MEDIA_BATCH_LIMIT,
  });

  if (error) {
    waLogger.error("wa_retention_purge_anonymized_failed");
    return 0;
  }

  return deleteAndMarkMedia(supabase, rows ?? []);
}

// Compartilhado pelas etapas 2 e 3: descriptografa o path, deleta o arquivo
// físico e marca media_expired apenas para os itens que tiveram sucesso —
// um item que falhar na deleção física não é marcado, para ser tentado de
// novo na próxima execução mensal.
async function deleteAndMarkMedia(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  rows: ExpirableMediaRow[]
): Promise<number> {
  const succeededIds: string[] = [];

  for (const row of rows) {
    try {
      const path = await decryptWaContent(supabase, row.media_url, row.workspace_id, row.key_version);
      if (!path) {
        continue;
      }
      await deleteWaMedia(supabase, path);
      succeededIds.push(row.message_id);
    } catch {
      waLogger.warn("wa_retention_media_delete_failed", { workspaceId: row.workspace_id });
    }
  }

  if (succeededIds.length > 0) {
    const { error: markError } = await supabase.rpc("wa_mark_media_expired", {
      p_message_ids: succeededIds,
    });
    if (markError) {
      waLogger.error("wa_retention_mark_media_expired_failed");
    }
  }

  return succeededIds.length;
}

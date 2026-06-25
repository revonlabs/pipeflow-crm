import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { encryptWaContent } from "@/lib/wa/crypto";
import { uploadWaMedia } from "@/lib/wa/media-storage";
import {
  parseWaWebhookEvent,
  parseConnectionUpdate,
  waInstanceStatusForState,
  type EvolutionWebhookPayload,
} from "@/lib/wa/webhook-parser";
import { waLogger } from "@/lib/wa/logger";
import type { Database } from "@/types/supabase";

// Worker de processamento da fila — chamado por pg_cron via pg_net, nunca
// por usuário ou pelo Route Handler de ingestão diretamente. Protegido por
// WA_WORKER_SECRET (header Authorization: Bearer), nunca por sessão.
//
// Backoff: 5s / 30s / 2min / 10min (índice = attempts antes de incrementar).
// Após 5 tentativas → status 'dead', sem mais retry automático.
const BACKOFF_SECONDS = [5, 30, 120, 600];
const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 50;

type QueueItem = Database["public"]["Tables"]["wa_webhook_queue"]["Row"];

function nextAttemptDelay(attempts: number): number {
  return BACKOFF_SECONDS[Math.min(attempts, BACKOFF_SECONDS.length - 1)];
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.WA_WORKER_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  const { data: items, error: dequeueError } = await supabase.rpc("wa_dequeue_webhook_items", {
    p_limit: BATCH_SIZE,
  });

  if (dequeueError) {
    waLogger.error("wa_worker_dequeue_failed");
    return NextResponse.json({ error: "dequeue_failed" }, { status: 500 });
  }

  let processed = 0;
  let failed = 0;
  let dead = 0;

  for (const item of items ?? []) {
    try {
      await processQueueItem(supabase, item);
      await supabase
        .from("wa_webhook_queue")
        .update({ status: "done", processed_at: new Date().toISOString() })
        .eq("id", item.id);
      processed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown_error";
      const nextAttempts = item.attempts + 1;

      if (nextAttempts >= MAX_ATTEMPTS) {
        await supabase
          .from("wa_webhook_queue")
          .update({ status: "dead", attempts: nextAttempts, last_error: message })
          .eq("id", item.id);
        dead++;
        waLogger.error("wa_worker_item_dead", { workspaceId: item.workspace_id });
      } else {
        const delaySeconds = nextAttemptDelay(item.attempts);
        await supabase
          .from("wa_webhook_queue")
          .update({
            status: "failed",
            attempts: nextAttempts,
            last_error: message,
            next_attempt_at: new Date(Date.now() + delaySeconds * 1000).toISOString(),
          })
          .eq("id", item.id);
        failed++;
        waLogger.warn("wa_worker_item_failed", { workspaceId: item.workspace_id });
      }
    }
  }

  return NextResponse.json({ processed, failed, dead, total: items?.length ?? 0 });
}

async function processQueueItem(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  item: QueueItem
): Promise<void> {
  const payload = item.payload as unknown as EvolutionWebhookPayload;

  if (item.event_type === "connection.update") {
    const connectionUpdate = parseConnectionUpdate(payload);
    if (connectionUpdate) {
      const { error: statusError } = await supabase.rpc("wa_update_instance_status_rpc", {
        p_instance_id: item.instance_id,
        p_status: waInstanceStatusForState(connectionUpdate.state),
        p_phone_number: connectionUpdate.phoneNumber ?? undefined,
      });
      if (statusError) {
        throw new Error("wa_instance_status_update_failed");
      }
    }
    return;
  }

  if (item.event_type !== "messages.upsert") {
    // Outros eventos (qrcode.updated, contacts.update, etc.) ainda não têm
    // processamento definido — marcar como concluído sem ação, não falhar.
    return;
  }

  const parsed = parseWaWebhookEvent(payload);

  if (!parsed) {
    return;
  }

  // Mensagens enviadas pela própria instância (fromMe) via outro canal não
  // entram no fluxo de intervenção manual (Sprint 5) — por ora, registradas
  // como direction 'out' / sent_by 'vendor' mesmo assim, sem tratamento especial.

  const remotePhone = parsed.remoteJid.split("@")[0];

  const { data: contact, error: contactError } = await supabase
    .from("wa_contacts")
    .upsert(
      {
        workspace_id: item.workspace_id,
        phone_number: remotePhone,
        display_name: parsed.pushName,
        last_message_at: parsed.timestampWa.toISOString(),
      },
      { onConflict: "workspace_id,phone_number" }
    )
    .select("id")
    .single();

  if (contactError || !contact) {
    throw new Error("wa_contact_upsert_failed");
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("wa_conversations")
    .upsert(
      {
        workspace_id: item.workspace_id,
        instance_id: item.instance_id,
        contact_id: contact.id,
        last_message_at: parsed.timestampWa.toISOString(),
        last_message_preview: parsed.contentText?.slice(0, 200) ?? null,
      },
      { onConflict: "instance_id,contact_id" }
    )
    .select("id")
    .single();

  if (conversationError || !conversation) {
    throw new Error("wa_conversation_upsert_failed");
  }

  let mediaPath: string | null = null;
  let mediaMime: string | null = null;

  if (parsed.media) {
    mediaPath = await uploadWaMedia(supabase, {
      workspaceId: item.workspace_id,
      instanceId: item.instance_id,
      evolutionMessageId: parsed.evolutionMessageId,
      base64: parsed.media.base64,
      mimetype: parsed.media.mimetype,
    });
    mediaMime = parsed.media.mimetype;
  }

  const encryptedContentText = parsed.contentText
    ? await encryptWaContent(supabase, parsed.contentText, item.workspace_id)
    : null;
  const encryptedMediaPath = mediaPath
    ? await encryptWaContent(supabase, mediaPath, item.workspace_id)
    : null;

  // Idempotência: evolution_message_id é UNIQUE — reenvio do webhook (ou
  // reprocessamento após falha parcial) nunca duplica mensagem.
  const { error: messageError } = await supabase
    .from("wa_messages")
    .insert({
      workspace_id: item.workspace_id,
      conversation_id: conversation.id,
      evolution_message_id: parsed.evolutionMessageId,
      direction: parsed.fromMe ? "out" : "in",
      sent_by: parsed.fromMe ? "vendor" : "contact",
      content_type: parsed.contentType,
      content_text: encryptedContentText,
      media_url: encryptedMediaPath,
      media_mime: mediaMime,
      timestamp_wa: parsed.timestampWa.toISOString(),
    })
    .select("id");

  if (messageError) {
    // Conflito de evolution_message_id (já processado) não é erro real —
    // tratar como sucesso idempotente em vez de retry infinito.
    if (messageError.code === "23505") {
      return;
    }
    throw new Error("wa_message_insert_failed");
  }
}

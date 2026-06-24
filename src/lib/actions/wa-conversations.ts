"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireWaAdmin } from "@/lib/wa/auth";
import { logWaAudit } from "@/lib/wa/audit";
import { getMasterKey } from "@/lib/wa/master-key";
import type {
  WaConversationListItem,
  WaConversationStatus,
  WaMessageContentType,
  WaMessageDecrypted,
  WaMessageDirection,
  WaMessageSentBy,
  WaMessageStatus,
} from "@/types";

const MESSAGES_PAGE_SIZE = 50;

interface GetConversationsFilters {
  instanceId?: string;
  status?: WaConversationStatus;
  search?: string;
  page?: number;
}

interface ConversationsRpcRow {
  id: string;
  instance_id: string;
  contact_id: string;
  contact_name: string | null;
  contact_phone: string;
  status: WaConversationStatus;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
}

export async function getConversationsAction(
  filters: GetConversationsFilters = {}
): Promise<{ conversations: WaConversationListItem[] } | { error: string }> {
  let workspaceId: string;
  try {
    ({ workspace: { id: workspaceId } } = await requireWaAdmin());
  } catch {
    return { error: "Acesso negado" };
  }

  const supabase = await getSupabaseServerClient();
  const page = filters.page ?? 1;
  const limit = 20;

  const { data, error } = await supabase.rpc("wa_list_conversations_rpc", {
    p_workspace_id: workspaceId,
    p_instance_id: filters.instanceId,
    p_status: filters.status,
    p_search: filters.search,
    p_limit: limit,
    p_offset: (page - 1) * limit,
  });

  if (error) {
    return { error: "Não foi possível carregar as conversas" };
  }

  const rows = (data ?? []) as ConversationsRpcRow[];

  return {
    conversations: rows.map((row) => ({
      id: row.id,
      instanceId: row.instance_id,
      contactId: row.contact_id,
      contactName: row.contact_name,
      contactPhone: row.contact_phone,
      status: row.status,
      lastMessageAt: row.last_message_at,
      lastMessagePreview: row.last_message_preview,
      unreadCount: row.unread_count,
    })),
  };
}

interface MessagesRpcRow {
  id: string;
  direction: WaMessageDirection;
  sent_by: WaMessageSentBy;
  content_type: WaMessageContentType | "unsupported";
  content_text: string | null;
  media_url: string | null;
  media_mime: string | null;
  status: WaMessageStatus | null;
  timestamp_wa: string;
}

export async function getConversationMessagesAction(
  conversationId: string,
  before?: string
): Promise<
  { messages: WaMessageDecrypted[]; hasMore: boolean } | { error: string }
> {
  let workspaceId: string;
  let userId: string;
  try {
    ({ workspace: { id: workspaceId }, userId } = await requireWaAdmin());
  } catch {
    return { error: "Acesso negado" };
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.rpc("wa_get_conversation_messages_rpc", {
    p_conversation_id: conversationId,
    p_workspace_id: workspaceId,
    p_master_key: getMasterKey(),
    p_before: before,
    p_limit: MESSAGES_PAGE_SIZE,
  });

  if (error) {
    return { error: "Não foi possível carregar as mensagens" };
  }

  const rows = (data ?? []) as MessagesRpcRow[];

  // Loga "view_conversation" só na primeira página (sem cursor `before`) —
  // scroll incremental não deve gerar uma linha de auditoria por página.
  if (!before) {
    await logWaAudit({
      workspaceId,
      userId,
      action: "view_conversation",
      targetType: "conversation",
      targetId: conversationId,
    });
  }

  return {
    messages: rows
      .map((row) => ({
        id: row.id,
        direction: row.direction,
        sentBy: row.sent_by,
        contentType: row.content_type,
        contentText: row.content_text,
        mediaPath: row.media_url,
        mediaMime: row.media_mime,
        status: row.status,
        timestampWa: row.timestamp_wa,
      }))
      // RPC ordena DESC (mais recente primeiro) para o LIMIT pegar as últimas;
      // a UI consome em ordem cronológica ascendente.
      .reverse(),
    hasMore: rows.length === MESSAGES_PAGE_SIZE,
  };
}

const SIGNED_URL_TTL_SECONDS = 300;

export async function getWaMediaSignedUrlAction(
  mediaPath: string
): Promise<{ url: string } | { error: string }> {
  try {
    await requireWaAdmin();
  } catch {
    return { error: "Acesso negado" };
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.storage
    .from("wa-media")
    .createSignedUrl(mediaPath, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    return { error: "Não foi possível gerar o link da mídia" };
  }

  return { url: data.signedUrl };
}

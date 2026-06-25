"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireWaAdmin } from "@/lib/wa/auth";
import { logWaAudit } from "@/lib/wa/audit";
import { getMasterKey } from "@/lib/wa/master-key";
import { sendTextMessage } from "@/lib/wa/evolution-client";
import type { WaMessageDecrypted } from "@/types";

export async function getVendorActivityAction(
  conversationId: string
): Promise<{ minutesSinceLastActivity: number | null } | { error: string }> {
  let workspaceId: string;
  try {
    ({ workspace: { id: workspaceId } } = await requireWaAdmin());
  } catch {
    return { error: "Acesso negado" };
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.rpc("wa_get_last_vendor_activity_rpc", {
    p_conversation_id: conversationId,
    p_workspace_id: workspaceId,
  });

  if (error) {
    return { error: "Não foi possível verificar a atividade do vendedor" };
  }

  if (!data) {
    return { minutesSinceLastActivity: null };
  }

  const minutesSinceLastActivity = (Date.now() - new Date(data).getTime()) / 60_000;
  return { minutesSinceLastActivity };
}

interface SendContextRow {
  evolution_instance_name: string;
  contact_phone: string;
}

interface SendResultRow {
  id: string;
  timestamp_wa: string;
}

export async function sendAdminMessageAction(
  conversationId: string,
  text: string
): Promise<{ message: WaMessageDecrypted } | { error: string }> {
  let workspaceId: string;
  let userId: string;
  try {
    ({ workspace: { id: workspaceId }, userId } = await requireWaAdmin());
  } catch {
    return { error: "Acesso negado" };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return { error: "Mensagem vazia" };
  }

  const supabase = await getSupabaseServerClient();

  const { data: contextData, error: contextError } = await supabase.rpc(
    "wa_get_conversation_send_context_rpc",
    { p_conversation_id: conversationId, p_workspace_id: workspaceId }
  );

  const context = ((contextData ?? []) as SendContextRow[])[0];
  if (contextError || !context) {
    return { error: "Conversa não encontrada" };
  }

  // Audit ANTES de enviar (spec §9.2) — se a Evolution falhar ou cair, ainda
  // existe registro da tentativa.
  await logWaAudit({
    workspaceId,
    userId,
    action: "send_intervention_attempt",
    targetType: "conversation",
    targetId: conversationId,
  });

  let evolutionMessageId: string;
  try {
    const result = await sendTextMessage({
      instanceName: context.evolution_instance_name,
      remoteJid: context.contact_phone,
      text: trimmed,
    });
    evolutionMessageId = result.evolutionMessageId;
  } catch {
    await logWaAudit({
      workspaceId,
      userId,
      action: "send_intervention_failed",
      targetType: "conversation",
      targetId: conversationId,
    });
    return { error: "Não foi possível enviar a mensagem" };
  }

  const { data: sendData, error: sendError } = await supabase.rpc(
    "wa_send_admin_message_rpc",
    {
      p_conversation_id: conversationId,
      p_workspace_id: workspaceId,
      p_user_id: userId,
      p_content_text: trimmed,
      p_evolution_message_id: evolutionMessageId,
      p_master_key: getMasterKey(),
    }
  );

  const sendRow = ((sendData ?? []) as SendResultRow[])[0];
  if (sendError || !sendRow) {
    // Mensagem já saiu pelo WhatsApp nesse ponto — falha é só de persistência
    // local. Loga como sucesso de envio (a entrega ocorreu) mas sinaliza o
    // erro de persistência no metadata para investigação.
    await logWaAudit({
      workspaceId,
      userId,
      action: "send_intervention_failed",
      targetType: "conversation",
      targetId: conversationId,
      metadata: { stage: "persist", evolutionMessageId },
    });
    return { error: "Mensagem enviada, mas houve falha ao salvar no histórico" };
  }

  await logWaAudit({
    workspaceId,
    userId,
    action: "send_intervention_success",
    targetType: "message",
    targetId: sendRow.id,
  });

  return {
    message: {
      id: sendRow.id,
      direction: "out",
      sentBy: "admin_intervention",
      contentType: "text",
      contentText: trimmed,
      mediaPath: null,
      mediaMime: null,
      status: "sent",
      timestampWa: sendRow.timestamp_wa,
    },
  };
}

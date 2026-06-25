"use server";

import { randomUUID } from "crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireWaAdmin } from "@/lib/wa/auth";
import { logWaAudit } from "@/lib/wa/audit";
import {
  createInstance,
  getInstanceConnect,
  deleteInstance,
  setInstanceWebhook,
} from "@/lib/wa/evolution-client";
import type { WaInstance } from "@/types";

function buildWebhookUrl(workspaceId: string, instanceId: string, webhookToken: string): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${appUrl}/api/wa/webhook/${workspaceId}/${instanceId}/${webhookToken}`;
}

export async function getInstancesAction(): Promise<{ instances: WaInstance[] } | { error: string }> {
  let workspaceId: string;
  try {
    ({ workspace: { id: workspaceId } } = await requireWaAdmin());
  } catch {
    return { error: "Acesso negado" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("wa_list_instances_rpc", {
    p_workspace_id: workspaceId,
  });

  if (error) {
    return { error: "Não foi possível carregar as instâncias" };
  }

  return {
    instances: (data ?? []).map((row) => ({
      id: row.id,
      workspace_id: workspaceId,
      evolution_instance_name: row.evolution_instance_name,
      phone_number: row.phone_number,
      display_name: row.display_name,
      owner_user_id: null,
      status: row.status as WaInstance["status"],
      webhook_secret: "",
      webhook_token: "",
      last_seen_at: row.last_seen_at,
      created_at: row.created_at,
      updated_at: row.created_at,
    })),
  };
}

export async function createInstanceAction(
  displayName: string
): Promise<{ instanceId: string; qrCode: { base64: string; pairingCode: string | null } } | { error: string }> {
  let workspaceId: string;
  let userId: string;
  try {
    ({ workspace: { id: workspaceId }, userId } = await requireWaAdmin());
  } catch {
    return { error: "Acesso negado" };
  }

  const trimmedName = displayName.trim();
  if (!trimmedName) {
    return { error: "Nome obrigatório" };
  }

  const supabase = await getSupabaseServerClient();

  // Nome único por instância (UNIQUE em wa_instances.evolution_instance_name)
  // gerado aqui — precisa existir ANTES de chamar a Evolution e a RPC de
  // criação, já que ambas usam o mesmo nome.
  const evolutionInstanceName = `ws-${workspaceId.slice(0, 8)}-${randomUUID().slice(0, 8)}`;

  const { data: createData, error: createError } = await supabase.rpc("wa_create_instance_rpc", {
    p_workspace_id: workspaceId,
    p_evolution_instance_name: evolutionInstanceName,
    p_display_name: trimmedName,
  });

  const createRow = (createData ?? [])[0];
  if (createError || !createRow) {
    return { error: "Não foi possível criar a instância" };
  }

  const webhookUrl = buildWebhookUrl(workspaceId, createRow.id, createRow.webhook_token);

  try {
    const qrcode = await createInstance({
      instanceName: evolutionInstanceName,
      webhookUrl,
    });

    // O webhook embutido no payload de /instance/create não se mostrou
    // confiável em teste real (instância criada sem o registro aparecer em
    // GET /webhook/find depois) — chama /webhook/set explicitamente em
    // sequência para garantir a configuração, independente do comportamento
    // do create nesta versão da Evolution.
    await setInstanceWebhook({
      instanceName: evolutionInstanceName,
      webhookUrl,
      events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "QRCODE_UPDATED"],
    });

    await logWaAudit({
      workspaceId,
      userId,
      action: "create_instance",
      targetType: "instance",
      targetId: createRow.id,
    });

    return {
      instanceId: createRow.id,
      qrCode: { base64: qrcode.base64, pairingCode: qrcode.pairingCode },
    };
  } catch {
    // A linha em wa_instances já existe (status qr_pending) mas a Evolution
    // falhou — não apaga a linha automaticamente: admin pode tentar
    // regenerar o QR (getInstanceQrAction) sem perder o registro/token.
    return { error: "Instância criada no CRM, mas a Evolution não respondeu. Tente gerar o QR novamente." };
  }
}

export async function getInstanceQrAction(
  instanceId: string
): Promise<{ qrCode: { base64: string; pairingCode: string | null } } | { error: string }> {
  let workspaceId: string;
  try {
    ({ workspace: { id: workspaceId } } = await requireWaAdmin());
  } catch {
    return { error: "Acesso negado" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("wa_instances")
    .select("evolution_instance_name")
    .eq("id", instanceId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error || !data) {
    return { error: "Instância não encontrada" };
  }

  try {
    const qrcode = await getInstanceConnect(data.evolution_instance_name);
    return { qrCode: { base64: qrcode.base64, pairingCode: qrcode.pairingCode } };
  } catch {
    return { error: "Não foi possível gerar um novo QR" };
  }
}

export async function deleteInstanceAction(instanceId: string): Promise<{ success: true } | { error: string }> {
  let workspaceId: string;
  let userId: string;
  try {
    ({ workspace: { id: workspaceId }, userId } = await requireWaAdmin());
  } catch {
    return { error: "Acesso negado" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("wa_instances")
    .select("evolution_instance_name")
    .eq("id", instanceId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error || !data) {
    return { error: "Instância não encontrada" };
  }

  try {
    await deleteInstance(data.evolution_instance_name);
  } catch {
    // Segue removendo do CRM mesmo se a Evolution já não tiver a instância
    // (ex: admin já tinha apagado direto na Evolution) — não deixa o registro
    // órfão no banco por causa de um 404 da Evolution.
  }

  const { error: deleteError } = await supabase.rpc("wa_delete_instance_rpc", {
    p_instance_id: instanceId,
    p_workspace_id: workspaceId,
  });

  if (deleteError) {
    return { error: "Não foi possível remover a instância" };
  }

  await logWaAudit({
    workspaceId,
    userId,
    action: "delete_instance",
    targetType: "instance",
    targetId: instanceId,
  });

  return { success: true };
}

import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sanitizeWebhookPayload, type EvolutionWebhookPayload } from "@/lib/wa/webhook-parser";
import { waLogger } from "@/lib/wa/logger";
import type { Json } from "@/types/supabase";

// Route Handler externo — a Evolution chama isto sem sessão de usuário
// (mesmo padrão do webhook do Stripe). Persiste o payload bruto (sanitizado)
// em wa_webhook_queue e responde rápido; o processamento real (parse,
// upsert de contato/conversa, upload de mídia) é do worker (pg_cron),
// ainda não implementado — ver wa-pgcrypto-sprint1-blocker.
//
// Validação: token na URL precisa bater com wa_instances.webhook_token
// (64 bytes aleatórios gerados por nós — migration 022). Qualquer falha →
// 401 imediato, sem processar nem logar o payload.
//
// CORREÇÃO (Sprint 5.5, payload real capturado em produção): o campo
// `apikey` do corpo do webhook NÃO é a EVOLUTION_API_KEY global — é um hash
// específico por instância gerado pela própria Evolution no /instance/create
// (campo `hash` da resposta), diferente para cada instância e fora do nosso
// controle. A checagem anterior contra EVOLUTION_API_KEY sempre falhava com
// 401 e nunca foi uma validação de segurança real (nunca configuramos nem
// conhecíamos esse valor por instância). O webhook_token da URL já é
// suficiente como segredo — não vale a pena passar a armazenar e validar
// esse hash por instância só para uma segunda camada redundante.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; instanceId: string; token: string }> }
) {
  const { workspaceId, instanceId, token } = await params;

  let body: EvolutionWebhookPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  const { data: instance, error: instanceError } = await supabase
    .from("wa_instances")
    .select("id, workspace_id, webhook_token, evolution_instance_name")
    .eq("id", instanceId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (instanceError) {
    waLogger.error("wa_webhook_instance_lookup_failed", { workspaceId });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  if (!instance || instance.webhook_token !== token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sanitizedPayload = sanitizeWebhookPayload(body);

  const { error: insertError } = await supabase.from("wa_webhook_queue").insert({
    workspace_id: workspaceId,
    instance_id: instanceId,
    event_type: body.event ?? "unknown",
    payload: sanitizedPayload as Json,
  });

  if (insertError) {
    waLogger.error("wa_webhook_queue_insert_failed", { workspaceId, instanceId });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

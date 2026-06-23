import "server-only";
import { headers } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { WaAuditAction } from "@/types";
import type { Json } from "@/types/supabase";

interface LogWaAuditInput {
  workspaceId: string;
  userId: string;
  action: WaAuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

// Auditoria imutável (spec §3.7/§11.1): nunca passar content_text, telefone
// completo ou token aqui. metadata deve conter só IDs e contadores.
// Insere via cliente da sessão (RLS exige user_id = auth.uid() + admin do
// workspace — ver migration 023), não via admin client: garante que o log
// não pode ser forjado em nome de outro usuário.
export async function logWaAudit(input: LogWaAuditInput): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const headerList = await headers();

  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = headerList.get("user-agent");

  const { error } = await supabase.from("wa_audit_log").insert({
    workspace_id: input.workspaceId,
    user_id: input.userId,
    action: input.action,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    ip_address: ipAddress,
    user_agent: userAgent,
    metadata: (input.metadata ?? null) as Json | null,
  });

  if (error) {
    throw new Error(`wa_audit_log_insert_failed: ${error.message}`);
  }
}

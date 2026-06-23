import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import type { WorkspaceContext } from "@/types";

export interface WaAdminContext {
  workspace: WorkspaceContext["workspace"];
  userId: string;
}

export class WaAccessDeniedError extends Error {
  constructor(reason: "no_session" | "no_workspace" | "not_admin") {
    super(`wa_access_denied:${reason}`);
    this.name = "WaAccessDeniedError";
  }
}

// Gate único do módulo WhatsApp: toda Server Action e Route Handler sob /wa
// e /api/wa/* deve chamar isto antes de tocar em qualquer tabela wa_*.
// Reusa getWorkspaceContext() (multi-tenant) — não reimplementa sessão/workspace.
// O módulo é admin-only por princípio de menor privilégio (spec §3.2):
// workspace_member nunca acessa dado de conversa, mesmo que RLS já bloqueie.
export async function requireWaAdmin(): Promise<WaAdminContext> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new WaAccessDeniedError("no_session");

  const ctx = await getWorkspaceContext();
  if (!ctx) throw new WaAccessDeniedError("no_workspace");

  if (ctx.role !== "admin") throw new WaAccessDeniedError("not_admin");

  return { workspace: ctx.workspace, userId: user.id };
}

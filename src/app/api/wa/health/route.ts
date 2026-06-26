import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireWaAdmin, WaAccessDeniedError } from "@/lib/wa/auth";
import { waLogger } from "@/lib/wa/logger";

// Health check do módulo (spec §11.2). Admin-only: não é um health check
// público de infra, é um painel operacional com contadores do workspace.
// Não expõe payload de mensagem, conteúdo ou segredo de instância — só
// contadores e status (sem PII).
export async function GET() {
  let ctx;
  try {
    ctx = await requireWaAdmin();
  } catch (err) {
    if (err instanceof WaAccessDeniedError) {
      const status = err.message.includes("no_session") ? 401 : 403;
      return NextResponse.json({ error: "forbidden" }, { status });
    }
    throw err;
  }

  const supabase = await getSupabaseServerClient();

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    instancesResult,
    queuePendingResult,
    queueDeadResult,
    archivableResult,
    expirableMediaResult,
  ] = await Promise.all([
    supabase
      .from("wa_instances")
      .select("status")
      .eq("workspace_id", ctx.workspace.id),
    supabase
      .from("wa_webhook_queue")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ctx.workspace.id)
      .in("status", ["pending", "failed"]),
    supabase
      .from("wa_webhook_queue")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ctx.workspace.id)
      .eq("status", "dead"),
    supabase
      .from("wa_messages")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ctx.workspace.id)
      .lt("timestamp_wa", ninetyDaysAgo),
    supabase
      .from("wa_messages")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ctx.workspace.id)
      .eq("media_expired", false)
      .not("media_url", "is", null)
      .lt("received_at", thirtyDaysAgo),
  ]);

  if (
    instancesResult.error ||
    queuePendingResult.error ||
    queueDeadResult.error ||
    archivableResult.error ||
    expirableMediaResult.error
  ) {
    waLogger.error("wa_health_check_failed", { workspaceId: ctx.workspace.id });
    return NextResponse.json({ error: "health_check_failed" }, { status: 500 });
  }

  const instancesByStatus = (instancesResult.data ?? []).reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return NextResponse.json({
    database: "ok",
    instances_by_status: instancesByStatus,
    webhook_queue: {
      pending_or_failed: queuePendingResult.count ?? 0,
      dead: queueDeadResult.count ?? 0,
    },
  });
}

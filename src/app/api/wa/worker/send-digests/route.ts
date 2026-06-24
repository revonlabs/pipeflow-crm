import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/resend";
import { renderWaDailyDigestEmail } from "@/emails/wa-daily-digest";
import { waLogger } from "@/lib/wa/logger";

// Worker do resumo diário — chamado por pg_cron via pg_net a cada 15 minutos
// (migration 034), nunca por usuário. Protegido por WA_WORKER_SECRET, nunca
// por sessão. wa_due_digest_workspaces decide quem está "devido" na janela
// atual — esta rota só busca métricas e envia, sem lógica de agendamento.
const WINDOW_MINUTES = 15;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.WA_WORKER_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  const { windowStart, windowEnd } = currentWindow();

  const { data: dueWorkspaces, error: dueError } = await supabase.rpc(
    "wa_due_digest_workspaces",
    { p_window_start: windowStart, p_window_end: windowEnd }
  );

  if (dueError) {
    waLogger.error("wa_digest_due_lookup_failed", { error: dueError.message });
    return NextResponse.json({ error: "due_lookup_failed" }, { status: 500 });
  }

  const results = await Promise.allSettled(
    (dueWorkspaces ?? []).map((due) =>
      sendDigestForWorkspace(supabase, due.workspace_id, due.period_hours)
    )
  );

  let sent = 0;
  let failed = 0;

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      sent++;
      return;
    }
    failed++;
    const due = (dueWorkspaces ?? [])[i];
    const message = result.reason instanceof Error ? result.reason.message : "unknown_error";
    waLogger.error("wa_digest_send_failed", { workspaceId: due.workspace_id, error: message });
  });

  return NextResponse.json({ sent, failed, total: dueWorkspaces?.length ?? 0 });
}

function currentWindow(): { windowStart: string; windowEnd: string } {
  const now = new Date();
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const windowStartMinutes = Math.floor(minutes / WINDOW_MINUTES) * WINDOW_MINUTES;
  const windowEndMinutes = windowStartMinutes + WINDOW_MINUTES;

  return {
    windowStart: formatTime(windowStartMinutes),
    windowEnd: formatTime(windowEndMinutes),
  };
}

function formatTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

async function sendDigestForWorkspace(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  workspaceId: string,
  periodHours: number
): Promise<void> {
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", workspaceId)
    .single();

  if (workspaceError || !workspace) {
    throw new Error("wa_digest_workspace_not_found");
  }

  const adminEmails = await getWorkspaceAdminEmails(supabase, workspaceId);

  if (adminEmails.length === 0) {
    throw new Error("wa_digest_no_admin_emails");
  }

  // Reivindica o envio ANTES de chamar o Resend: marca last_sent_at
  // atomicamente, então uma segunda varredura concorrente ou um retry desta
  // mesma janela não reenvia o mesmo resumo (ver migration 035).
  const { data: claimed, error: claimError } = await supabase.rpc("wa_claim_digest_send", {
    p_workspace_id: workspaceId,
  });

  if (claimError) {
    throw new Error("wa_digest_claim_failed");
  }
  if (!claimed) {
    return;
  }

  const fromDate = new Date(Date.now() - periodHours * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const toDate = new Date().toISOString().slice(0, 10);

  const { data: metricsRows, error: metricsError } = await supabase
    .from("wa_response_metrics")
    .select(
      "total_in, total_out, unique_contacts, conversations_started, conversations_unanswered_1h"
    )
    .eq("workspace_id", workspaceId)
    .gte("date", fromDate)
    .lte("date", toDate);

  if (metricsError) {
    throw new Error("wa_digest_metrics_query_failed");
  }

  const totals = (metricsRows ?? []).reduce(
    (acc, row) => ({
      totalIn: acc.totalIn + row.total_in,
      totalOut: acc.totalOut + row.total_out,
      uniqueContacts: acc.uniqueContacts + row.unique_contacts,
      conversationsStarted: acc.conversationsStarted + row.conversations_started,
      conversationsUnanswered1h: acc.conversationsUnanswered1h + row.conversations_unanswered_1h,
    }),
    {
      totalIn: 0,
      totalOut: 0,
      uniqueContacts: 0,
      conversationsStarted: 0,
      conversationsUnanswered1h: 0,
    }
  );

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const periodLabel = periodHours === 24 ? "últimas 24 horas" : periodHours === 48 ? "últimas 48 horas" : "últimos 7 dias";

  const html = renderWaDailyDigestEmail({
    workspaceName: workspace.name,
    periodLabel,
    totalIn: totals.totalIn,
    totalOut: totals.totalOut,
    uniqueContacts: totals.uniqueContacts,
    conversationsStarted: totals.conversationsStarted,
    conversationsUnanswered1h: totals.conversationsUnanswered1h,
    dashboardUrl: `${appUrl}/wa/metrics`,
  });

  const resend = getResendClient();
  const { error: emailError } = await resend.emails.send({
    from: "Revon Studio CRM <onboarding@resend.dev>",
    to: adminEmails,
    subject: `Resumo de WhatsApp — ${workspace.name}`,
    html,
  });

  if (emailError) {
    // last_sent_at já foi marcado pela reivindicação acima — se o envio
    // falhar aqui, o workspace só tenta de novo no dia seguinte (não há
    // retry dentro do mesmo dia). Aceito: o pior caso é perder um resumo,
    // nunca duplicar.
    throw new Error("wa_digest_email_send_failed");
  }
}

async function getWorkspaceAdminEmails(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  workspaceId: string
): Promise<string[]> {
  const { data: members, error: membersError } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId)
    .eq("role", "admin");

  if (membersError || !members || members.length === 0) {
    return [];
  }

  // Busca em lote (1 chamada à Admin API) em vez de 1 chamada por admin —
  // mesmo padrão de inviteMemberAction em workspaces.ts.
  const { data: usersPage } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const adminIds = new Set(members.map((m) => m.user_id));

  return (usersPage?.users ?? [])
    .filter((u) => adminIds.has(u.id) && !!u.email)
    .map((u) => u.email!);
}

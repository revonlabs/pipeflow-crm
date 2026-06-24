"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireWaAdmin } from "@/lib/wa/auth";
import { logWaAudit } from "@/lib/wa/audit";

export interface WaMetricsDailyRow {
  date: string;
  totalIn: number;
  totalOut: number;
  uniqueContacts: number;
  conversationsStarted: number;
  conversationsUnanswered1h: number;
  avgFirstResponseSeconds: number | null;
}

interface MetricsRpcRow {
  date: string;
  total_in: number;
  total_out: number;
  unique_contacts: number;
  conversations_started: number;
  conversations_unanswered_1h: number;
  avg_first_response_seconds: number | null;
}

const DEFAULT_RANGE_DAYS = 30;

// Agrega por dia somando todas as instâncias do workspace — o dashboard
// mostra visão consolidada, não por número de WhatsApp.
export async function getMetricsOverviewAction(): Promise<
  { rows: WaMetricsDailyRow[] } | { error: string }
> {
  let workspaceId: string;
  let userId: string;
  try {
    ({ workspace: { id: workspaceId }, userId } = await requireWaAdmin());
  } catch {
    return { error: "Acesso negado" };
  }

  const supabase = await getSupabaseServerClient();

  const to = new Date();
  const from = new Date(to.getTime() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase.rpc("wa_get_metrics_overview_rpc", {
    p_workspace_id: workspaceId,
    p_from: from.toISOString().slice(0, 10),
    p_to: to.toISOString().slice(0, 10),
  });

  if (error) {
    return { error: "Não foi possível carregar as métricas" };
  }

  await logWaAudit({
    workspaceId,
    userId,
    action: "view_dashboard",
  });

  const rows = (data ?? []) as MetricsRpcRow[];

  return {
    rows: rows.map((row) => ({
      date: row.date,
      totalIn: row.total_in,
      totalOut: row.total_out,
      uniqueContacts: row.unique_contacts,
      conversationsStarted: row.conversations_started,
      conversationsUnanswered1h: row.conversations_unanswered_1h,
      avgFirstResponseSeconds: row.avg_first_response_seconds,
    })),
  };
}

import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { waLogger } from "@/lib/wa/logger";

// Worker de agregação de métricas — chamado por pg_cron via pg_net a cada
// hora (migration 034), nunca por usuário. Protegido por WA_WORKER_SECRET
// (mesmo secret do worker de ingestão, 027/028), nunca por sessão.
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.WA_WORKER_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.rpc("wa_aggregate_metrics", {});

  if (error) {
    waLogger.error("wa_metrics_aggregation_failed", { error: error.message });
    return NextResponse.json({ error: "aggregation_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

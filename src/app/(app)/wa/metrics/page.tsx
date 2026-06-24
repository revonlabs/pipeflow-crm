import { redirect } from "next/navigation";
import { requireWaAdmin, WaAccessDeniedError } from "@/lib/wa/auth";
import { getMetricsOverviewAction } from "@/lib/actions/wa-metrics";
import { WaMetricsDashboard } from "@/components/wa/wa-metrics-dashboard";
import { WaSubnav } from "@/components/wa/wa-subnav";

export default async function WaMetricsPage() {
  try {
    await requireWaAdmin();
  } catch (err) {
    if (err instanceof WaAccessDeniedError) {
      redirect("/dashboard");
    }
    throw err;
  }

  const result = await getMetricsOverviewAction();
  const rows = "rows" in result ? result.rows : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Métricas — WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Volume de mensagens e atividade das conversas monitoradas.
        </p>
      </div>
      <WaSubnav />
      <WaMetricsDashboard rows={rows} />
    </div>
  );
}

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCardsGrid } from "@/components/dashboard/metric-cards-grid";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { UpcomingDeals } from "@/components/dashboard/upcoming-deals";
import type { DealStage } from "@/types";

const STAGE_ORDER: DealStage[] = ["new_lead", "contacted", "proposal_sent", "negotiation", "won", "lost"];

const STAGE_LABELS: Record<DealStage, string> = {
  new_lead: "Novo Lead",
  contacted: "Contatado",
  proposal_sent: "Proposta Enviada",
  negotiation: "Negociação",
  won: "Ganho",
  lost: "Perdido",
};

const STAGE_COLORS: Record<DealStage, string> = {
  new_lead: "#5B7FFF",
  contacted: "#00B4D8",
  proposal_sent: "#CAFF33",
  negotiation: "#FF6B35",
  won: "#2ED573",
  lost: "#FF4757",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return null;

  const wid = ctx.workspace.id;

  const [{ count: totalLeads }, { data: deals }] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", wid),
    supabase
      .from("deals")
      .select("id, stage, value, title, lead_id, owner_id, due_date, position, created_at, workspace_id, lead:leads(id, name, company, email)")
      .eq("workspace_id", wid),
  ]);

  const allDeals = deals ?? [];
  const openDeals = allDeals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const wonDeals = allDeals.filter((d) => d.stage === "won");
  const closedDeals = allDeals.filter((d) => d.stage === "won" || d.stage === "lost");

  const pipelineValue = openDeals.reduce((s, d) => s + (d.value ?? 0), 0);
  const conversionRate =
    closedDeals.length > 0 ? Math.round((wonDeals.length / closedDeals.length) * 1000) / 10 : 0;

  const funnelData = STAGE_ORDER.map((stage) => {
    const stageDeals = allDeals.filter((d) => d.stage === stage);
    return {
      stage,
      label: STAGE_LABELS[stage],
      color: STAGE_COLORS[stage],
      count: stageDeals.length,
      value: stageDeals.reduce((s, d) => s + (d.value ?? 0), 0),
    };
  });

  const today = new Date();

  const upcomingDeals = allDeals
    .filter((d) => d.due_date && d.stage !== "won" && d.stage !== "lost")
    .map((d) => ({
      ...d,
      daysUntilDue: Math.ceil(
        (new Date(d.due_date!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }))
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral do seu pipeline e métricas de vendas"
      />

      <MetricCardsGrid
        totalLeads={totalLeads ?? 0}
        totalLeadsChange={0}
        openDeals={openDeals.length}
        openDealsChange={0}
        pipelineValue={formatCurrency(pipelineValue)}
        pipelineValueChange={0}
        conversionRate={`${conversionRate}%`}
        conversionRateChange={0}
      />

      <FunnelChart data={funnelData} />

      <UpcomingDeals
        deals={upcomingDeals.map((d) => ({
          id: d.id,
          title: d.title,
          stage: d.stage as DealStage,
          value: d.value,
          due_date: d.due_date,
          owner_id: d.owner_id,
          daysUntilDue: d.daysUntilDue,
          lead: d.lead as { name: string; company: string | null } | null,
        }))}
        stageLabels={STAGE_LABELS}
        stageColors={STAGE_COLORS}
      />
    </div>
  );
}

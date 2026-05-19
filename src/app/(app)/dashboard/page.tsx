import { PageHeader } from "@/components/shared/page-header";
import { MetricCardsGrid } from "@/components/dashboard/metric-cards-grid";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { UpcomingDeals } from "@/components/dashboard/upcoming-deals";
import { MOCK_METRICS } from "@/lib/mock/metrics";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const {
    totalLeads,
    totalLeadsChange,
    openDeals,
    openDealsChange,
    pipelineValue,
    pipelineValueChange,
    conversionRate,
    conversionRateChange,
  } = MOCK_METRICS;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral do seu pipeline e métricas de vendas"
      />

      <MetricCardsGrid
        totalLeads={totalLeads}
        totalLeadsChange={totalLeadsChange}
        openDeals={openDeals}
        openDealsChange={openDealsChange}
        pipelineValue={formatCurrency(pipelineValue)}
        pipelineValueChange={pipelineValueChange}
        conversionRate={`${conversionRate}%`}
        conversionRateChange={conversionRateChange}
      />

      <FunnelChart />

      <UpcomingDeals />
    </div>
  );
}

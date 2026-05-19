import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { BarChart3 } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral do seu pipeline e métricas de vendas"
      />
      <EmptyState
        icon={BarChart3}
        title="Dashboard em construção"
        description="Os gráficos e métricas serão implementados na próxima aula."
      />
    </div>
  );
}

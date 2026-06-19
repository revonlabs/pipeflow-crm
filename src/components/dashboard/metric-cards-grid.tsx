"use client";

import { Users, Briefcase, DollarSign, Target } from "lucide-react";
import { MetricCard } from "./metric-card";

interface MetricCardsGridProps {
  totalLeads: number;
  totalLeadsChange: number;
  openDeals: number;
  openDealsChange: number;
  pipelineValue: string;
  pipelineValueChange: number;
  conversionRate: string;
  conversionRateChange: number;
}

export function MetricCardsGrid({
  totalLeads,
  totalLeadsChange,
  openDeals,
  openDealsChange,
  pipelineValue,
  pipelineValueChange,
  conversionRate,
  conversionRateChange,
}: MetricCardsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Total de Leads"
        value={String(totalLeads)}
        change={totalLeadsChange}
        icon={<Users className="h-5 w-5" style={{ color: "#4A90E2" }} />}
        accentColor="#4A90E2"
      />
      <MetricCard
        label="Negócios Abertos"
        value={String(openDeals)}
        change={openDealsChange}
        icon={<Briefcase className="h-5 w-5" style={{ color: "#FFAB40" }} />}
        accentColor="#FFAB40"
      />
      <MetricCard
        label="Valor do Pipeline"
        value={pipelineValue}
        change={pipelineValueChange}
        icon={<DollarSign className="h-5 w-5" style={{ color: "#FF7043" }} />}
        accentColor="#FF7043"
      />
      <MetricCard
        label="Taxa de Conversão"
        value={conversionRate}
        change={conversionRateChange}
        icon={<Target className="h-5 w-5" style={{ color: "#CE59B2" }} />}
        accentColor="#CE59B2"
      />
    </div>
  );
}

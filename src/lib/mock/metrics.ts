import { MOCK_DEALS } from "./deals";
import { MOCK_LEADS } from "./leads";
import type { DealStage } from "@/types";

const STAGE_ORDER: DealStage[] = [
  "new_lead",
  "contacted",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
];

const STAGE_LABELS: Record<DealStage, string> = {
  new_lead: "Novo Lead",
  contacted: "Contatado",
  proposal_sent: "Proposta Enviada",
  negotiation: "Negociação",
  won: "Ganho",
  lost: "Perdido",
};

const STAGE_COLORS: Record<DealStage, string> = {
  new_lead: "#4A90E2",
  contacted: "#FFAB40",
  proposal_sent: "#FF7043",
  negotiation: "#CE59B2",
  won: "#3BFFA0",
  lost: "#4A6785",
};

const activeDeals = MOCK_DEALS.filter(
  (d) => d.stage !== "won" && d.stage !== "lost"
);

const wonDeals = MOCK_DEALS.filter((d) => d.stage === "won");

const totalPipeline = activeDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);

const wonCount = wonDeals.length;
const closedCount = MOCK_DEALS.filter(
  (d) => d.stage === "won" || d.stage === "lost"
).length;

export const MOCK_METRICS = {
  totalLeads: MOCK_LEADS.length,
  totalLeadsChange: +18.4,

  openDeals: activeDeals.length,
  openDealsChange: +5.2,

  pipelineValue: totalPipeline,
  pipelineValueChange: +23.1,

  conversionRate: closedCount > 0 ? Math.round((wonCount / closedCount) * 1000) / 10 : 0,
  conversionRateChange: -2.3,
};

export const MOCK_FUNNEL = STAGE_ORDER.map((stage) => {
  const stageDeals = MOCK_DEALS.filter((d) => d.stage === stage);
  return {
    stage,
    label: STAGE_LABELS[stage],
    color: STAGE_COLORS[stage],
    count: stageDeals.length,
    value: stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0),
  };
});

const today = new Date("2026-05-19");

export const MOCK_UPCOMING_DEALS = MOCK_DEALS.filter(
  (d) => d.due_date && d.stage !== "won" && d.stage !== "lost"
)
  .map((d) => ({
    ...d,
    daysUntilDue: Math.ceil(
      (new Date(d.due_date!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    ),
  }))
  .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
  .slice(0, 6);

export { STAGE_LABELS, STAGE_COLORS };

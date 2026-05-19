"use client";

import { useState } from "react";
import { Plus, TrendingUp, Target, Trophy, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanBoard, STAGE_CONFIG } from "@/components/kanban/kanban-board";
import { DealFormDialog } from "@/components/kanban/deal-form-dialog";
import { MOCK_DEALS } from "@/lib/mock/deals";
import type { Deal, DealStage } from "@/types";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: value >= 1_000_000 ? "compact" : "standard",
    minimumFractionDigits: 0,
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value);
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  delay: number;
}

function StatCard({ icon: Icon, label, value, sub, color, delay }: StatCardProps) {
  return (
    <div
      className="stat-enter flex items-center gap-3 px-4 py-2.5 rounded-lg border"
      style={{
        animationDelay: `${delay}ms`,
        backgroundColor: "#141416",
        borderColor: "#2A2A2E",
      }}
    >
      <div
        className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p
          className="text-[10px] uppercase tracking-[0.12em] leading-none mb-1 truncate text-[#555559]"
          style={{ fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)" }}
        >
          {label}
        </p>
        <p
          className="text-[13px] font-bold leading-none text-[#E8E8E8]"
          style={{ fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)" }}
        >
          {value}
        </p>
        {sub && (
          <p
            className="text-[10px] text-[#555559] mt-0.5"
            style={{ fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)" }}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>(MOCK_DEALS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [defaultStage, setDefaultStage] = useState<DealStage>("new_lead");

  // Stats
  const openDeals = deals.filter(
    (d) => d.stage !== "won" && d.stage !== "lost"
  );
  const wonDeals = deals.filter((d) => d.stage === "won");
  const pipelineValue = openDeals.reduce((s, d) => s + (d.value ?? 0), 0);
  const wonValue = wonDeals.reduce((s, d) => s + (d.value ?? 0), 0);
  const conversionRate =
    deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;

  function handleOpenCreate(stage: DealStage = "new_lead") {
    setDefaultStage(stage);
    setEditingDeal(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(deal: Deal) {
    setEditingDeal(deal);
    setDialogOpen(true);
  }

  function handleSubmit(deal: Deal) {
    if (editingDeal) {
      setDeals((prev) => prev.map((d) => (d.id === deal.id ? deal : d)));
    } else {
      setDeals((prev) => [{ ...deal, position: 0 }, ...prev]);
    }
  }

  function handleDelete(id: string) {
    setDeals((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="h-full flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1
            className="text-xl font-bold text-[#E8E8E8]"
            style={{ fontFamily: "var(--font-display, 'Syne', sans-serif)" }}
          >
            Pipeline
          </h1>
          <p
            className="text-[12px] text-[#555559] mt-0.5"
            style={{ fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)" }}
          >
            Acompanhe seus negócios em cada etapa do funil
          </p>
        </div>
        <Button
          onClick={() => handleOpenCreate()}
          size="sm"
          className="gap-1.5 border-0 text-[12px] font-semibold"
          style={{ backgroundColor: "#CAFF33", color: "#0C0C0E" }}
        >
          <Plus className="h-3.5 w-3.5" />
          Novo Negócio
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2.5 mb-4 shrink-0">
        <StatCard
          icon={BarChart3}
          label="Pipeline ativo"
          value={formatBRL(pipelineValue)}
          sub={`${openDeals.length} negócios`}
          color="#5B7FFF"
          delay={0}
        />
        <StatCard
          icon={Trophy}
          label="Receita ganha"
          value={formatBRL(wonValue)}
          sub={`${wonDeals.length} fechados`}
          color="#2ED573"
          delay={60}
        />
        <StatCard
          icon={Target}
          label="Taxa de conversão"
          value={`${conversionRate}%`}
          sub="do total de deals"
          color="#CAFF33"
          delay={120}
        />
        <StatCard
          icon={TrendingUp}
          label="Total de negócios"
          value={String(deals.length)}
          sub="em todos os estágios"
          color="#00B4D8"
          delay={180}
        />
      </div>

      {/* Stage progress bar */}
      <div className="flex gap-0.5 mb-4 h-1 rounded-full overflow-hidden shrink-0">
        {(Object.entries(STAGE_CONFIG) as [DealStage, { label: string; color: string }][]).map(
          ([stage, { color }]) => {
            const count = deals.filter((d) => d.stage === stage).length;
            const pct = deals.length > 0 ? (count / deals.length) * 100 : 0;
            return pct > 0 ? (
              <div
                key={stage}
                className="transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
                title={`${STAGE_CONFIG[stage].label}: ${count}`}
              />
            ) : null;
          }
        )}
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden min-h-0">
        <KanbanBoard
          deals={deals}
          onMoveDeals={setDeals}
          onEditDeal={handleOpenEdit}
          onAddDeal={handleOpenCreate}
        />
      </div>

      <DealFormDialog
        open={dialogOpen}
        deal={editingDeal}
        defaultStage={defaultStage}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}

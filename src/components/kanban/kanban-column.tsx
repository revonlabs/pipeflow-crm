"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DealCard } from "./deal-card";
import type { Deal, DealStage } from "@/types";

interface KanbanColumnProps {
  stage: DealStage;
  deals: Deal[];
  stageColor: string;
  stageLabel: string;
  columnIndex: number;
  onEditDeal: (deal: Deal) => void;
  onAddDeal?: (stage: DealStage) => void;
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function KanbanColumn({
  stage,
  deals,
  stageColor,
  stageLabel,
  columnIndex,
  onEditDeal,
  onAddDeal,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  const totalValue = deals.reduce((sum, d) => sum + (d.value ?? 0), 0);

  return (
    <div
      className="kanban-column-enter flex flex-col w-[260px] shrink-0 h-full"
      style={{ animationDelay: `${columnIndex * 55}ms` }}
    >
      {/* ── Column header ── */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-t-lg border border-b-0"
        style={{ borderColor: "#2A2A2E", backgroundColor: "#0D1B2E" }}
      >
        {/* Dot com cor do stage */}
        <div
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: stageColor }}
        />

        {/* Nome do stage — uppercase */}
        <span
          className="text-[11px] font-medium uppercase tracking-[0.12em] flex-1 truncate text-[#8BACD4]"
          style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
        >
          {stageLabel}
        </span>

        {/* Contagem */}
        <span
          className="text-[11px] font-semibold px-1.5 py-0.5 rounded border shrink-0"
          style={{
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            color: stageColor,
            backgroundColor: `${stageColor}10`,
            borderColor: `${stageColor}25`,
          }}
        >
          {deals.length}
        </span>

        {/* Botão adicionar */}
        {onAddDeal && (
          <button
            onClick={() => onAddDeal(stage)}
            className="text-[#4A6785] hover:text-[#FF7043] transition-colors duration-150 shrink-0"
            title="Adicionar negócio"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Valor total ── */}
      <div
        className="px-3 py-1.5 border-x flex items-center justify-between"
        style={{ borderColor: "#2A2A2E", backgroundColor: "#060B14" }}
      >
        <span
          className="text-[13px] font-bold text-[#F0F8FF]"
          style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
        >
          {totalValue > 0 ? formatBRL(totalValue) : "—"}
        </span>
        {totalValue > 0 && (
          <span
            className="text-[10px] uppercase tracking-wider text-[#4A6785]"
            style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
          >
            {deals.length} deal{deals.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Droppable card area ── */}
      <div
        ref={setNodeRef}
        className={cn(
          "column-cards-scroll flex-1 flex flex-col gap-2 p-2 overflow-y-auto",
          "rounded-b-lg border transition-colors duration-150"
        )}
        style={{
          borderColor: isOver ? `${stageColor}40` : "#2A2A2E",
          backgroundColor: isOver ? `${stageColor}06` : "#060B14",
        }}
      >
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal, i) => (
            <DealCard
              key={deal.id}
              deal={deal}
              stageColor={stageColor}
              onEdit={onEditDeal}
              cardIndex={i}
            />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
            <div
              className="h-6 w-6 rounded border-2 border-dashed flex items-center justify-center"
              style={{ borderColor: `${stageColor}25` }}
            />
            <p
              className="text-[10px] uppercase tracking-wider text-center text-[#4A6785]"
              style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
            >
              Arraste aqui
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

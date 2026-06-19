"use client";

import { useMemo, useState, useId } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { DealCard } from "./deal-card";
import type { Deal, DealStage } from "@/types";

// Cores do brand guide v2
export const STAGE_CONFIG: Record<DealStage, { label: string; color: string }> =
  {
    new_lead:      { label: "Novo Lead",        color: "#5B7FFF" },
    contacted:     { label: "Contatado",         color: "#00B4D8" },
    proposal_sent: { label: "Proposta Enviada", color: "#CAFF33" },
    negotiation:   { label: "Negociação",        color: "#FF6B35" },
    won:           { label: "Ganho",             color: "#2ED573" },
    lost:          { label: "Perdido",           color: "#FF4757" },
  };

export const DEAL_STAGES: DealStage[] = [
  "new_lead",
  "contacted",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
];

interface KanbanBoardProps {
  deals: Deal[];
  onMoveDeals: (updated: Deal[]) => void;
  onEditDeal: (deal: Deal) => void;
  onAddDeal?: (stage: DealStage) => void;
  onRequestLostConfirm?: (deal: Deal, updated: Deal[]) => void;
}

export function KanbanBoard({
  deals,
  onMoveDeals,
  onEditDeal,
  onAddDeal,
  onRequestLostConfirm,
}: KanbanBoardProps) {
  const dndId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const dealsByStage = useMemo(
    () =>
      DEAL_STAGES.reduce<Record<DealStage, Deal[]>>(
        (acc, stage) => {
          acc[stage] = deals
            .filter((d) => d.stage === stage)
            .sort((a, b) => a.position - b.position);
          return acc;
        },
        {} as Record<DealStage, Deal[]>
      ),
    [deals]
  );

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeDeal = deals.find((d) => d.id === activeId);
    if (!activeDeal) return;

    const activeStage = activeDeal.stage;
    const isOverStage = (DEAL_STAGES as string[]).includes(overId);
    const targetStage: DealStage = isOverStage
      ? (overId as DealStage)
      : (deals.find((d) => d.id === overId)?.stage ?? activeStage);

    // Reorder within the same stage
    if (activeStage === targetStage && !isOverStage) {
      const stageDeals = dealsByStage[activeStage];
      const oldIndex = stageDeals.findIndex((d) => d.id === activeId);
      const newIndex = stageDeals.findIndex((d) => d.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(stageDeals, oldIndex, newIndex).map(
        (d, i) => ({ ...d, position: i })
      );

      const updated = deals.map((d) => {
        const found = reordered.find((r) => r.id === d.id);
        return found ?? d;
      });

      onMoveDeals(updated);
      return;
    }

    // Move to a different stage
    const movedDeal: Deal = {
      ...activeDeal,
      stage: targetStage,
      lost_reason_id: targetStage === "lost" ? activeDeal.lost_reason_id : null,
    };
    const withoutActive = deals.filter((d) => d.id !== activeId);

    let insertIndex: number;
    if (isOverStage) {
      const targetDeals = withoutActive.filter((d) => d.stage === targetStage);
      movedDeal.position = targetDeals.length;
      insertIndex = withoutActive.length;
    } else {
      insertIndex = withoutActive.findIndex((d) => d.id === overId);
      if (insertIndex === -1) insertIndex = withoutActive.length;
    }

    const withMoved = [
      ...withoutActive.slice(0, insertIndex),
      movedDeal,
      ...withoutActive.slice(insertIndex),
    ];

    const affectedStages = new Set([activeStage, targetStage]);
    const updated = withMoved.map((d) => {
      if (!affectedStages.has(d.stage)) return d;
      const stageDeals = withMoved.filter((x) => x.stage === d.stage);
      return { ...d, position: stageDeals.indexOf(d) };
    });

    if (targetStage === "lost" && activeStage !== "lost" && onRequestLostConfirm) {
      onRequestLostConfirm(activeDeal, updated);
      return;
    }

    onMoveDeals(updated);
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-scroll flex gap-3 overflow-x-auto pb-3 h-full items-start">
        {DEAL_STAGES.map((stage, index) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            deals={dealsByStage[stage]}
            stageColor={STAGE_CONFIG[stage].color}
            stageLabel={STAGE_CONFIG[stage].label}
            columnIndex={index}
            onEditDeal={onEditDeal}
            onAddDeal={onAddDeal}
          />
        ))}
      </div>

      <DragOverlay
        dropAnimation={{
          duration: 220,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {activeDeal ? (
          <DealCard
            deal={activeDeal}
            stageColor={STAGE_CONFIG[activeDeal.stage].color}
            onEdit={() => {}}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

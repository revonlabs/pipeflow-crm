"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, CalendarX } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MOCK_MEMBERS } from "@/lib/mock/leads";
import type { Deal } from "@/types";

interface DealCardProps {
  deal: Deal;
  stageColor: string;
  onEdit: (deal: Deal) => void;
  isDragOverlay?: boolean;
  cardIndex?: number;
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const OWNER_HUE = ["#5B7FFF", "#CAFF33", "#FF6B35"] as const;

export function DealCard({
  deal,
  stageColor,
  onEdit,
  isDragOverlay = false,
  cardIndex = 0,
}: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const owner = MOCK_MEMBERS.find((m) => m.id === deal.owner_id);
  const ownerColor = owner
    ? OWNER_HUE[MOCK_MEMBERS.indexOf(owner) % 3]
    : "#8A8A8F";

  const isOverdue =
    deal.due_date ? new Date(deal.due_date) < new Date() : false;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    animationDelay: `${cardIndex * 40}ms`,
    "--deal-card-color": stageColor,
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn("deal-card-enter", isDragOverlay && "pointer-events-none")}
    >
      <div
        onClick={() => !isDragOverlay && onEdit(deal)}
        className={cn(
          "deal-card-inner rounded-lg border cursor-grab active:cursor-grabbing select-none",
          // v2 surface — sem glassmorphism, sem blur
          "bg-[#141416] border-[#2A2A2E]",
          isDragOverlay && "rotate-[1.5deg] scale-[1.02] opacity-90 cursor-grabbing"
        )}
        style={{ "--deal-card-color": stageColor } as React.CSSProperties}
      >
        <div className="p-3">
          {/* Título — Syne (herda h* style do CSS base) */}
          <p
            className="text-[13px] font-semibold leading-snug line-clamp-2 text-[#E8E8E8] mb-1.5"
            style={{ fontFamily: "var(--font-display, 'Syne', sans-serif)" }}
          >
            {deal.title}
          </p>

          {/* Lead + Empresa — DM Sans, secondary */}
          {deal.lead && (
            <p className="text-[11px] text-[#8A8A8F] truncate mb-3 leading-none">
              {deal.lead.name}
              {deal.lead.company && (
                <span className="text-[#555559]"> · {deal.lead.company}</span>
              )}
            </p>
          )}

          {/* Bottom row */}
          <div className="flex items-center justify-between gap-2">
            {/* Valor — IBM Plex Mono, cor do stage */}
            {deal.value !== null ? (
              <span
                className="text-[12px] font-semibold tracking-tight"
                style={{
                  fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
                  color: stageColor,
                }}
              >
                {formatBRL(deal.value)}
              </span>
            ) : (
              <span
                className="text-[11px] text-[#555559] italic"
                style={{ fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)" }}
              >
                sem valor
              </span>
            )}

            <div className="flex items-center gap-1.5">
              {/* Prazo */}
              {deal.due_date && (
                <span
                  className={cn(
                    "flex items-center gap-[3px] text-[10px] font-medium px-1.5 py-0.5 rounded border",
                    "uppercase tracking-wide",
                    isOverdue
                      ? "text-[#FF4757] bg-[#FF4757]/8 border-[#FF4757]/20"
                      : "text-[#555559] bg-[#1A1A1E] border-[#2A2A2E]"
                  )}
                  style={{ fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)" }}
                >
                  {isOverdue ? (
                    <CalendarX className="h-[9px] w-[9px]" />
                  ) : (
                    <Calendar className="h-[9px] w-[9px]" />
                  )}
                  {format(new Date(deal.due_date), "dd MMM", { locale: ptBR })}
                </span>
              )}

              {/* Avatar responsável */}
              {owner && (
                <div
                  className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold border shrink-0"
                  style={{
                    backgroundColor: `${ownerColor}15`,
                    color: ownerColor,
                    borderColor: `${ownerColor}30`,
                    fontFamily: "var(--font-display, 'Syne', sans-serif)",
                  }}
                  title={owner.name}
                >
                  {owner.name.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

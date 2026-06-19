"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, CalendarX, Clock, AlarmClock } from "lucide-react";
import { format, isToday, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
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

const OWNER_HUE = ["#4A90E2", "#FF7043", "#CE59B2", "#FFAB40", "#3BFFA0"] as const;

function ownerColorFromId(id: string | null) {
  if (!id) return "#8BACD4";
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return OWNER_HUE[Math.abs(hash) % OWNER_HUE.length];
}

function ownerInitial(id: string | null) {
  if (!id) return null;
  return id.slice(0, 1).toUpperCase();
}

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

  const ownerColor = ownerColorFromId(deal.owner_id);

  const isOverdue =
    deal.due_date ? new Date(deal.due_date) < new Date() : false;

  const nextTaskDate = deal.next_task?.due_at ? new Date(deal.next_task.due_at) : null;
  const isTaskToday = nextTaskDate ? isToday(nextTaskDate) : false;
  const isTaskOverdue = nextTaskDate ? isPast(nextTaskDate) && !isTaskToday : false;

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
          "bg-[#0D1B2E] border-[#2A2A2E]",
          isDragOverlay && "rotate-[1.5deg] scale-[1.02] opacity-90 cursor-grabbing"
        )}
        style={{ "--deal-card-color": stageColor } as React.CSSProperties}
      >
        <div className="p-3">
          {/* Título — Syne (herda h* style do CSS base) */}
          <p
            className="text-[13px] font-semibold leading-snug line-clamp-2 text-[#F0F8FF] mb-1.5"
            style={{ fontFamily: "var(--font-sans, 'Inter', sans-serif)" }}
          >
            {deal.title}
          </p>

          {/* Lead + Empresa — DM Sans, secondary */}
          {deal.lead && (
            <p className="text-[11px] text-[#8BACD4] truncate mb-3 leading-none">
              {deal.lead.name}
              {deal.lead.company && (
                <span className="text-[#4A6785]"> · {deal.lead.company}</span>
              )}
            </p>
          )}

          {/* Bottom row */}
          <div className="flex items-center justify-between gap-2">
            {/* Valor — IBM Plex Mono, cor do stage */}
            {deal.recurring_value || deal.setup_value ? (
              <span className="flex flex-col leading-tight">
                {deal.recurring_value > 0 && (
                  <span
                    className="text-[12px] font-semibold tracking-tight"
                    style={{
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      color: stageColor,
                    }}
                  >
                    {formatBRL(deal.recurring_value)}/mês
                  </span>
                )}
                {deal.setup_value > 0 && (
                  <span
                    className="text-[10px] text-[#8BACD4]"
                    style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
                  >
                    + {formatBRL(deal.setup_value)} setup
                  </span>
                )}
              </span>
            ) : (
              <span
                className="text-[11px] text-[#4A6785] italic"
                style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
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
                      ? "text-[#FF4444] bg-[#FF4444]/8 border-[#FF4444]/20"
                      : "text-[#4A6785] bg-[#0D1B2E] border-[#2A2A2E]"
                  )}
                  style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
                >
                  {isOverdue ? (
                    <CalendarX className="h-[9px] w-[9px]" />
                  ) : (
                    <Calendar className="h-[9px] w-[9px]" />
                  )}
                  {format(new Date(deal.due_date), "dd MMM", { locale: ptBR })}
                </span>
              )}

              {/* Próximo contato */}
              {nextTaskDate && (
                <span
                  className={cn(
                    "flex items-center gap-[3px] text-[10px] font-medium px-1.5 py-0.5 rounded border",
                    "uppercase tracking-wide",
                    isTaskOverdue
                      ? "text-[#FF4444] bg-[#FF4444]/8 border-[#FF4444]/20"
                      : isTaskToday
                      ? "text-[#FFAB40] bg-[#FFAB40]/8 border-[#FFAB40]/20"
                      : "text-[#4A6785] bg-[#0D1B2E] border-[#2A2A2E]"
                  )}
                  style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
                >
                  {isTaskOverdue ? (
                    <AlarmClock className="h-[9px] w-[9px]" />
                  ) : (
                    <Clock className="h-[9px] w-[9px]" />
                  )}
                  {isTaskToday
                    ? "Hoje"
                    : isTaskOverdue
                    ? "Atrasado"
                    : format(nextTaskDate, "dd MMM", { locale: ptBR })}
                </span>
              )}

              {/* Avatar responsável */}
              {deal.owner_id && (
                <div
                  className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold border shrink-0"
                  style={{
                    backgroundColor: `${ownerColor}15`,
                    color: ownerColor,
                    borderColor: `${ownerColor}30`,
                    fontFamily: "var(--font-sans, 'Inter', sans-serif)",
                  }}
                >
                  {ownerInitial(deal.owner_id)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

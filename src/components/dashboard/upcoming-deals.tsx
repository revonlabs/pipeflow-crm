"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarX, CalendarClock } from "lucide-react";
import type { DealStage } from "@/types";

interface UpcomingDeal {
  id: string;
  title: string;
  stage: DealStage;
  value: number | null;
  due_date: string | null;
  owner_id: string | null;
  daysUntilDue: number;
  lead: { name: string; company: string | null } | null;
}

interface UpcomingDealsProps {
  deals: UpcomingDeal[];
  stageLabels: Record<DealStage, string>;
  stageColors: Record<DealStage, string>;
}

const AVATAR_COLORS = ["#5B7FFF", "#00B4D8", "#FF6B35", "#2ED573", "#CAFF33"];

function avatarColor(ownerId: string | null) {
  if (!ownerId) return "#8A8A8F";
  // Gera cor consistente baseada no ID
  let hash = 0;
  for (let i = 0; i < ownerId.length; i++) hash = ownerId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function ownerInitials(ownerId: string | null) {
  if (!ownerId) return "?";
  return ownerId.slice(0, 2).toUpperCase();
}

export function UpcomingDeals({ deals, stageLabels, stageColors }: UpcomingDealsProps) {
  return (
    <Card className="border-0" style={{ background: "#141416", border: "1px solid #2A2A2E" }}>
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#8A8A8F" }}>
          Negócios com Prazo Próximo
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {deals.length === 0 ? (
          <p className="px-5 py-4 text-sm" style={{ color: "#555559" }}>
            Nenhum negócio com prazo definido.
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: "#2A2A2E" }}>
            {deals.map((deal) => {
              const isOverdue = deal.daysUntilDue < 0;
              const isUrgent = deal.daysUntilDue >= 0 && deal.daysUntilDue <= 7;
              const stageColor = stageColors[deal.stage];
              const ac = avatarColor(deal.owner_id);

              return (
                <div
                  key={deal.id}
                  className="flex items-center gap-4 px-5 py-3 transition-colors"
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1A1A1E")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="h-7 w-0.5 shrink-0 rounded-full" style={{ background: stageColor }} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: "#E8E8E8" }}>{deal.title}</p>
                    <p className="truncate text-xs" style={{ color: "#8A8A8F" }}>
                      {deal.lead?.name ?? "—"} · {deal.lead?.company ?? ""}
                    </p>
                  </div>

                  <Badge
                    className="hidden shrink-0 text-xs font-medium sm:flex"
                    style={{ background: `${stageColor}18`, color: stageColor, border: `1px solid ${stageColor}30` }}
                  >
                    {stageLabels[deal.stage]}
                  </Badge>

                  <span
                    className="hidden shrink-0 font-mono text-xs font-semibold md:block"
                    style={{ color: "#E8E8E8", fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {deal.value != null
                      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(deal.value)
                      : "—"}
                  </span>

                  <div
                    className="flex shrink-0 items-center gap-1"
                    style={{ color: isOverdue ? "#FF4757" : isUrgent ? "#FF6B35" : "#555559" }}
                  >
                    {isOverdue ? <CalendarX className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
                    <span className="font-mono text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {isOverdue
                        ? `${Math.abs(deal.daysUntilDue)}d atraso`
                        : deal.daysUntilDue === 0
                        ? "hoje"
                        : `${deal.daysUntilDue}d`}
                    </span>
                  </div>

                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: `${ac}22`, color: ac, fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {ownerInitials(deal.owner_id)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

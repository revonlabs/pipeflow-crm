"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlarmClock, Clock } from "lucide-react";
import type { DealStage } from "@/types";

interface PendingTask {
  id: string;
  title: string;
  due_at: string;
  deal: { id: string; title: string; stage: DealStage } | null;
}

interface PendingTasksProps {
  tasks: PendingTask[];
  stageLabels: Record<DealStage, string>;
  stageColors: Record<DealStage, string>;
}

function formatDueAt(dueAt: string) {
  const date = new Date(dueAt);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PendingTasks({ tasks, stageLabels, stageColors }: PendingTasksProps) {
  const now = Date.now();

  return (
    <Card className="border-0" style={{ background: "#141416", border: "1px solid #2A2A2E" }}>
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#8A8A8F" }}>
          Próximos Contatos
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {tasks.length === 0 ? (
          <p className="px-5 py-4 text-sm" style={{ color: "#555559" }}>
            Nenhum próximo contato agendado.
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: "#2A2A2E" }}>
            {tasks.map((task) => {
              const due = new Date(task.due_at).getTime();
              const isOverdue = due < now;
              const stage = task.deal?.stage;
              const stageColor = stage ? stageColors[stage] : "#555559";

              return (
                <Link
                  key={task.id}
                  href="/pipeline"
                  className="flex items-center gap-4 px-5 py-3 transition-colors"
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1A1A1E")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="h-7 w-0.5 shrink-0 rounded-full" style={{ background: stageColor }} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: "#E8E8E8" }}>
                      {task.deal?.title ?? task.title}
                    </p>
                    <p className="truncate text-xs" style={{ color: "#8A8A8F" }}>{task.title}</p>
                  </div>

                  {stage && (
                    <Badge
                      className="hidden shrink-0 text-xs font-medium sm:flex"
                      style={{ background: `${stageColor}18`, color: stageColor, border: `1px solid ${stageColor}30` }}
                    >
                      {stageLabels[stage]}
                    </Badge>
                  )}

                  <div
                    className="flex shrink-0 items-center gap-1"
                    style={{ color: isOverdue ? "#FF4757" : "#FFC107" }}
                  >
                    {isOverdue ? <AlarmClock className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                    <span className="font-mono text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatDueAt(task.due_at)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

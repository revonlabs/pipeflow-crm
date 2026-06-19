"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ActivityTimeline } from "@/components/leads/activity-timeline";
import { ActivityFormDialog } from "@/components/leads/activity-form-dialog";
import { getDealActivities } from "@/lib/actions/activities";
import type { Activity } from "@/types";

interface DealActivitySectionProps {
  dealId: string;
  leadId: string;
  workspaceId: string;
}

export function DealActivitySection({ dealId, leadId, workspaceId }: DealActivitySectionProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function reload() {
    startTransition(async () => {
      const data = await getDealActivities(dealId, workspaceId);
      setActivities(data);
    });
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId, workspaceId]);

  return (
    <div className="px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3
          className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#8A8A8F]"
          style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
        >
          Atividades
          {activities.length > 0 && (
            <span className="ml-1.5 text-[#555559]">({activities.length})</span>
          )}
        </h3>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-[12px] border-[#2A2A2E] bg-transparent text-[#8A8A8F] hover:bg-[#1A1A1E] hover:text-[#E8E8E8]"
          onClick={() => setFormOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Registrar
        </Button>
      </div>

      <Separator style={{ backgroundColor: "#1E1E22" }} />

      {isPending ? (
        <p className="text-[12px] text-[#555559] py-3">Carregando...</p>
      ) : (
        <ActivityTimeline activities={activities} />
      )}

      <ActivityFormDialog
        open={formOpen}
        leadId={leadId}
        dealId={dealId}
        onOpenChange={setFormOpen}
        onSuccess={reload}
      />
    </div>
  );
}

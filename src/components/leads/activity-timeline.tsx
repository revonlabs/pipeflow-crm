import { ActivityItem } from "@/components/leads/activity-item";
import { EmptyState } from "@/components/shared/empty-state";
import { Clock } from "lucide-react";
import type { Activity } from "@/types";

interface ActivityTimelineProps {
  activities: (Activity & {
    author?: { id: string; email: string; user_metadata?: { full_name?: string } };
  })[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="Sem atividades ainda"
        description="As atividades registradas para este lead aparecerão aqui."
      />
    );
  }

  const sorted = [...activities].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="pt-2">
      {sorted.map((activity, index) => (
        <ActivityItem
          key={activity.id}
          activity={activity}
          isLast={index === sorted.length - 1}
        />
      ))}
    </div>
  );
}

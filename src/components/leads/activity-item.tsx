import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Phone, Mail, Users, FileText } from "lucide-react";
import type { Activity, ActivityType } from "@/types";

interface ActivityItemProps {
  activity: Activity & {
    author?: { id: string; email: string; user_metadata?: { full_name?: string } };
  };
  isLast?: boolean;
}

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: React.ElementType; label: string; iconClass: string; dotClass: string }
> = {
  call: {
    icon: Phone,
    label: "Ligação",
    iconClass: "text-emerald-400",
    dotClass: "bg-emerald-500/20 border-emerald-500/40",
  },
  email: {
    icon: Mail,
    label: "E-mail",
    iconClass: "text-blue-400",
    dotClass: "bg-blue-500/20 border-blue-500/40",
  },
  meeting: {
    icon: Users,
    label: "Reunião",
    iconClass: "text-violet-400",
    dotClass: "bg-violet-500/20 border-violet-500/40",
  },
  note: {
    icon: FileText,
    label: "Nota",
    iconClass: "text-amber-400",
    dotClass: "bg-amber-500/20 border-amber-500/40",
  },
};

function getAuthorName(activity: ActivityItemProps["activity"]) {
  return activity.author?.user_metadata?.full_name ?? activity.author?.email ?? "—";
}

export function ActivityItem({ activity, isLast = false }: ActivityItemProps) {
  const config = ACTIVITY_CONFIG[activity.type];
  const Icon = config.icon;

  return (
    <div className="flex gap-4">
      {/* Linha vertical da timeline */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${config.dotClass}`}
        >
          <Icon className={`h-3.5 w-3.5 ${config.iconClass}`} />
        </div>
        {!isLast && <div className="mt-1 flex-1 w-px bg-border min-h-[24px]" />}
      </div>

      {/* Conteúdo */}
      <div className="pb-5 min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-medium">{config.label}</span>
          <span className="text-xs text-muted-foreground">por {getAuthorName(activity)}</span>
          <span className="text-xs text-muted-foreground ml-auto shrink-0">
            {format(new Date(activity.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          {activity.description}
        </p>
      </div>
    </div>
  );
}

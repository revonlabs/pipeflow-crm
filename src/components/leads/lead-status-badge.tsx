import { Badge } from "@/components/ui/badge";
import type { LeadStatus } from "@/types";

interface LeadStatusBadgeProps {
  status: LeadStatus;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  active: {
    label: "Ativo",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20",
  },
  inactive: {
    label: "Inativo",
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30 hover:bg-zinc-500/20",
  },
  converted: {
    label: "Convertido",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/20",
  },
  lost: {
    label: "Perdido",
    className: "bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/20",
  },
};

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

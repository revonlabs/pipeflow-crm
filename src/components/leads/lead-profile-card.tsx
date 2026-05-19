import { Mail, Phone, Building2, Briefcase, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { MOCK_MEMBERS } from "@/lib/mock/leads";
import type { Lead } from "@/types";

interface LeadProfileCardProps {
  lead: Lead;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getOwnerName(ownerId: string | null) {
  if (!ownerId) return "Sem responsável";
  return MOCK_MEMBERS.find((m) => m.id === ownerId)?.name ?? "—";
}

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

export function LeadProfileCard({ lead }: LeadProfileCardProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col items-center text-center gap-3">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">
              {getInitials(lead.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold leading-tight">{lead.name}</h2>
            {lead.role && (
              <p className="text-sm text-muted-foreground mt-0.5">{lead.role}</p>
            )}
            {lead.company && (
              <p className="text-sm text-muted-foreground">{lead.company}</p>
            )}
          </div>
          <LeadStatusBadge status={lead.status} />
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4 space-y-3">
        <InfoRow icon={Mail} label="E-mail" value={lead.email} />
        {lead.phone && (
          <InfoRow icon={Phone} label="Telefone" value={lead.phone} />
        )}
        {lead.company && (
          <InfoRow icon={Building2} label="Empresa" value={lead.company} />
        )}
        {lead.role && (
          <InfoRow icon={Briefcase} label="Cargo" value={lead.role} />
        )}
        <InfoRow
          icon={Calendar}
          label="Criado em"
          value={format(new Date(lead.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        />

        <Separator />

        <div className="flex items-center gap-3">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="text-xs bg-muted text-muted-foreground">
              {getInitials(getOwnerName(lead.owner_id))}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Responsável</p>
            <p className="text-sm font-medium truncate">{getOwnerName(lead.owner_id)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

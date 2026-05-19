"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LeadProfileCard } from "@/components/leads/lead-profile-card";
import { ActivityTimeline } from "@/components/leads/activity-timeline";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { MOCK_LEADS, MOCK_ACTIVITIES } from "@/lib/mock/leads";
import type { Lead } from "@/types";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(
    MOCK_LEADS.find((l) => l.id === id) ?? null
  );
  const [editOpen, setEditOpen] = useState(false);

  const activities = MOCK_ACTIVITIES[id] ?? [];

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">Lead não encontrado.</p>
        <Button variant="outline" asChild>
          <Link href="/leads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Leads
          </Link>
        </Button>
      </div>
    );
  }

  function handleSubmit(
    values: { name: string; email: string; phone?: string; company?: string; role?: string; status: Lead["status"]; owner_id?: string; notes?: string },
    _id?: string
  ) {
    setLead((prev) =>
      prev
        ? {
            ...prev,
            name: values.name,
            email: values.email,
            phone: values.phone ?? null,
            company: values.company ?? null,
            role: values.role ?? null,
            status: values.status,
            owner_id: values.owner_id ?? null,
          }
        : prev
    );
  }

  function handleDelete(_id: string) {
    router.push("/leads");
  }

  return (
    <div className="space-y-6">
      {/* Topbar de navegação */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/leads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Leads
          </Link>
        </Button>
        <Button onClick={() => setEditOpen(true)} variant="outline" size="sm" className="gap-2">
          <Pencil className="h-3.5 w-3.5" />
          Editar Lead
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar: perfil */}
        <div className="space-y-4">
          <LeadProfileCard lead={lead} />
        </div>

        {/* Conteúdo principal */}
        <div className="space-y-6 min-w-0">
          {/* Informações detalhadas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoField label="Nome completo" value={lead.name} />
                <InfoField label="E-mail" value={lead.email} />
                <InfoField label="Telefone" value={lead.phone ?? "—"} />
                <InfoField label="Empresa" value={lead.company ?? "—"} />
                <InfoField label="Cargo" value={lead.role ?? "—"} />
                <InfoField
                  label="Status"
                  value={
                    {
                      active: "Ativo",
                      inactive: "Inativo",
                      converted: "Convertido",
                      lost: "Perdido",
                    }[lead.status]
                  }
                />
              </dl>
            </CardContent>
          </Card>

          {/* Timeline de atividades */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Atividades
                  {activities.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({activities.length})
                    </span>
                  )}
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  className="gap-1.5 text-xs"
                  title="Disponível no M8 — integração com banco de dados"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Registrar
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <ActivityTimeline activities={activities} />
            </CardContent>
          </Card>
        </div>
      </div>

      <LeadFormDialog
        open={editOpen}
        lead={lead}
        onOpenChange={setEditOpen}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}

interface InfoFieldProps {
  label: string;
  value: string;
}

function InfoField({ label, value }: InfoFieldProps) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}

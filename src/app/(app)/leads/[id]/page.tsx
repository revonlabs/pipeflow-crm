import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LeadProfileCard } from "@/components/leads/lead-profile-card";
import { ActivityTimeline } from "@/components/leads/activity-timeline";
import { LeadDetailClient, ActivityButton } from "@/components/leads/lead-detail-client";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { getWorkspaceMembers } from "@/lib/members";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return null;

  const [{ data: lead }, { data: activitiesRaw }, members] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", ctx.workspace.id)
      .single(),
    supabase
      .from("activities")
      .select("*")
      .eq("lead_id", id)
      .eq("workspace_id", ctx.workspace.id)
      .order("created_at", { ascending: false }),
    getWorkspaceMembers(ctx.workspace.id),
  ]);

  if (!lead) notFound();

  // Enriquece atividades com dados do autor
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const activities = (activitiesRaw ?? []).map((a) => {
    const author = a.author_id ? memberMap.get(a.author_id) : undefined;
    return {
      ...a,
      author: author
        ? { id: author.id, email: author.email, user_metadata: { full_name: author.name } }
        : undefined,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/leads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Leads
          </Link>
        </Button>
        <LeadDetailClient lead={lead} members={members} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <LeadProfileCard
            lead={lead}
            ownerName={lead.owner_id ? (memberMap.get(lead.owner_id)?.name ?? "—") : "Sem responsável"}
          />
        </div>

        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoField label="Nome completo" value={lead.name} />
                <InfoField label="E-mail" value={lead.email ?? "—"} />
                <InfoField label="Telefone" value={lead.phone ?? "—"} />
                <InfoField label="Empresa" value={lead.company ?? "—"} />
                <InfoField label="Cargo" value={lead.role ?? "—"} />
                <InfoField
                  label="Status"
                  value={
                    { active: "Ativo", inactive: "Inativo", converted: "Convertido", lost: "Perdido" }[lead.status]
                  }
                />
              </dl>
            </CardContent>
          </Card>

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
                <ActivityButton leadId={id} />
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <ActivityTimeline activities={activities} />
            </CardContent>
          </Card>
        </div>
      </div>
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

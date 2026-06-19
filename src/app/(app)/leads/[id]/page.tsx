import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LeadProfileCard } from "@/components/leads/lead-profile-card";
import { ActivityTimeline } from "@/components/leads/activity-timeline";
import { LeadDetailClient } from "@/components/leads/lead-detail-client";
import { LeadDealsSection } from "@/components/leads/lead-deals-section";
import { LeadDealMetricCard } from "@/components/dashboard/lead-deal-metric-card";
import { formatCurrencyValue } from "@/lib/format-currency";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { getWorkspaceMembers } from "@/lib/members";
import { getWorkspaceTags } from "@/lib/actions/tags";
import { getWorkspaceLostReasons } from "@/lib/actions/lost-reasons";
import type { Lead, Deal, Tag, DealStage, Activity, ActivityType } from "@/types";

const OPEN_STAGES: DealStage[] = ["new_lead", "contacted", "proposal_sent", "negotiation"];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return null;

  const [{ data: lead }, { data: activitiesRaw }, { data: dealsRaw }, members, workspaceTags, lostReasons] = await Promise.all([
    supabase
      .from("leads")
      .select("*, lead_tags(tags(*))")
      .eq("id", id)
      .eq("workspace_id", ctx.workspace.id)
      .single(),
    supabase
      .from("activities")
      .select("*")
      .eq("lead_id", id)
      .eq("workspace_id", ctx.workspace.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("deals")
      .select("*, lead:leads(id, name, company, email)")
      .eq("lead_id", id)
      .eq("workspace_id", ctx.workspace.id)
      .order("created_at", { ascending: false }),
    getWorkspaceMembers(ctx.workspace.id),
    getWorkspaceTags(ctx.workspace.id),
    getWorkspaceLostReasons(ctx.workspace.id),
  ]);

  if (!lead) notFound();
  const { lead_tags, ...leadRest } = lead as typeof lead & { lead_tags: { tags: Tag }[] };
  const typedLead = { ...leadRest, tags: (lead_tags ?? []).map((lt) => lt.tags) } as unknown as Lead;
  const deals = (dealsRaw ?? []) as unknown as Deal[];

  const openSum = deals.filter((d) => OPEN_STAGES.includes(d.stage)).reduce((s, d) => s + (d.value ?? 0), 0);
  const wonSum = deals.filter((d) => d.stage === "won").reduce((s, d) => s + (d.value ?? 0), 0);
  const lostSum = deals.filter((d) => d.stage === "lost").reduce((s, d) => s + (d.value ?? 0), 0);

  // Enriquece atividades com dados do autor
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const activities = (activitiesRaw ?? []).map((a) => {
    const author = a.author_id ? memberMap.get(a.author_id) : undefined;
    return {
      ...a,
      type: a.type as ActivityType,
      author: author
        ? { id: author.id, email: author.email, user_metadata: { full_name: author.name } }
        : undefined,
    };
  }) as Activity[];

  // Atividades antigas: criadas antes da migração de timeline para o deal (sem deal_id)
  const legacyActivities = activities.filter((a) => !a.deal_id);

  // Última atividade por deal — para o resumo dentro de LeadDealsSection
  const lastActivityByDeal: Record<string, Activity> = {};
  for (const activity of activities) {
    if (!activity.deal_id) continue;
    const current = lastActivityByDeal[activity.deal_id];
    if (!current || new Date(activity.created_at) > new Date(current.created_at)) {
      lastActivityByDeal[activity.deal_id] = activity;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/leads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Leads
          </Link>
        </Button>
        <LeadDetailClient lead={typedLead} members={members} workspaceTags={workspaceTags} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <LeadProfileCard
            lead={typedLead}
            ownerName={typedLead.owner_id ? (memberMap.get(typedLead.owner_id)?.name ?? "—") : "Sem responsável"}
          />
        </div>

        <div className="space-y-6 min-w-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <LeadDealMetricCard
              label="Em aberto"
              value={`R$ ${formatCurrencyValue(openSum)}`}
              count={deals.filter((d) => OPEN_STAGES.includes(d.stage)).length}
              accentColor="#4A90E2"
            />
            <LeadDealMetricCard
              label="Ganho"
              value={`R$ ${formatCurrencyValue(wonSum)}`}
              count={deals.filter((d) => d.stage === "won").length}
              accentColor="#3BFFA0"
            />
            <LeadDealMetricCard
              label="Perdido"
              value={`R$ ${formatCurrencyValue(lostSum)}`}
              count={deals.filter((d) => d.stage === "lost").length}
              accentColor="#4A6785"
            />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoField label="Nome completo" value={typedLead.name} />
                <InfoField label="E-mail" value={typedLead.email ?? "—"} />
                <InfoField label="Telefone" value={typedLead.phone ?? "—"} />
                <InfoField label="Empresa" value={typedLead.company ?? "—"} />
                <InfoField label="Cargo" value={typedLead.role ?? "—"} />
                <InfoField
                  label="Status"
                  value={
                    { active: "Ativo", inactive: "Inativo", converted: "Convertido", lost: "Perdido" }[typedLead.status]
                  }
                />
              </dl>
            </CardContent>
          </Card>

          <LeadDealsSection
            leadId={typedLead.id}
            leadName={typedLead.name}
            leadCompany={typedLead.company}
            leadEmail={typedLead.email}
            deals={deals}
            members={members}
            lostReasons={lostReasons}
            workspaceId={ctx.workspace.id}
            lastActivityByDeal={lastActivityByDeal}
          />

          {legacyActivities.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Atividades antigas
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({legacyActivities.length})
                  </span>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Registradas antes da timeline migrar para cada negociação. Somente leitura.
                </p>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <ActivityTimeline activities={legacyActivities} />
              </CardContent>
            </Card>
          )}
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

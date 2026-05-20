import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { getWorkspaceMembers } from "@/lib/members";
import { PageHeader } from "@/components/shared/page-header";
import { LeadsTable } from "@/components/leads/leads-table";

export default async function LeadsPage() {
  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return null;

  const [{ data: leads }, members] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .order("created_at", { ascending: false }),
    getWorkspaceMembers(ctx.workspace.id),
  ]);

  const allLeads = leads ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description={`${allLeads.length} contato${allLeads.length !== 1 ? "s" : ""} no workspace`}
        action={null}
      />

      <LeadsTable leads={allLeads} members={members} />
    </div>
  );
}

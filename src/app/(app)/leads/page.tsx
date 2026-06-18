import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { getWorkspaceMembers } from "@/lib/members";
import { getWorkspaceTags } from "@/lib/actions/tags";
import { PageHeader } from "@/components/shared/page-header";
import { LeadsTable } from "@/components/leads/leads-table";
import type { Lead, Tag } from "@/types";

export default async function LeadsPage() {
  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return null;

  const [{ data: leads }, members, workspaceTags] = await Promise.all([
    supabase
      .from("leads")
      .select("*, lead_tags(tags(*))")
      .eq("workspace_id", ctx.workspace.id)
      .order("created_at", { ascending: false }),
    getWorkspaceMembers(ctx.workspace.id),
    getWorkspaceTags(ctx.workspace.id),
  ]);

  const allLeads = (leads ?? []).map((lead) => {
    const { lead_tags, ...rest } = lead as typeof lead & { lead_tags: { tags: Tag }[] };
    return { ...rest, tags: (lead_tags ?? []).map((lt) => lt.tags) };
  }) as unknown as Lead[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description={`${allLeads.length} contato${allLeads.length !== 1 ? "s" : ""} no workspace`}
        action={null}
      />

      <LeadsTable leads={allLeads} members={members} workspaceTags={workspaceTags} />
    </div>
  );
}

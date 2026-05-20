import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { getWorkspaceMembers } from "@/lib/members";
import { PipelineClient } from "@/components/kanban/pipeline-client";

export default async function PipelinePage() {
  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return null;

  const [{ data: deals }, { data: leads }, members] = await Promise.all([
    supabase
      .from("deals")
      .select("*, lead:leads(id, name, company, email)")
      .eq("workspace_id", ctx.workspace.id)
      .order("position", { ascending: true }),
    supabase
      .from("leads")
      .select("id, name, company, email")
      .eq("workspace_id", ctx.workspace.id)
      .order("name", { ascending: true }),
    getWorkspaceMembers(ctx.workspace.id),
  ]);

  return (
    <PipelineClient
      initialDeals={(deals ?? []) as Parameters<typeof PipelineClient>[0]["initialDeals"]}
      leads={leads ?? []}
      members={members}
    />
  );
}

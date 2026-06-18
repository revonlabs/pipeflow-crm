import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { getWorkspaceMembers } from "@/lib/members";
import { PipelineClient } from "@/components/kanban/pipeline-client";
import type { Task } from "@/types";

export default async function PipelinePage() {
  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return null;

  const [{ data: deals }, { data: leads }, members] = await Promise.all([
    supabase
      .from("deals")
      .select("*, lead:leads(id, name, company, email), tasks(id, due_at, title, completed_at)")
      .eq("workspace_id", ctx.workspace.id)
      .order("position", { ascending: true }),
    supabase
      .from("leads")
      .select("id, name, company, email")
      .eq("workspace_id", ctx.workspace.id)
      .order("name", { ascending: true }),
    getWorkspaceMembers(ctx.workspace.id),
  ]);

  const dealsWithNextTask = (deals ?? []).map((deal) => {
    const { tasks, ...rest } = deal as typeof deal & { tasks: Task[] };
    const pending = (tasks ?? [])
      .filter((t) => !t.completed_at)
      .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
    return { ...rest, next_task: pending[0] ?? null };
  });

  return (
    <PipelineClient
      initialDeals={dealsWithNextTask as Parameters<typeof PipelineClient>[0]["initialDeals"]}
      leads={leads ?? []}
      members={members}
    />
  );
}

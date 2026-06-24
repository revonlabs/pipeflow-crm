import { redirect } from "next/navigation";
import { requireWaAdmin, WaAccessDeniedError } from "@/lib/wa/auth";
import { logWaAudit } from "@/lib/wa/audit";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getConversationsAction } from "@/lib/actions/wa-conversations";
import { ConversationList } from "@/components/wa/conversation-list";

export default async function WhatsAppMonitorPage() {
  let ctx;
  try {
    ctx = await requireWaAdmin();
  } catch (err) {
    if (err instanceof WaAccessDeniedError) {
      // not_admin: usuário autenticado, mas sem acesso ao módulo (menor privilégio).
      // no_session / no_workspace: o AppLayout já trataria isso antes de chegar aqui;
      // redirect aqui é defesa em profundidade caso a página seja alcançada direto.
      redirect("/dashboard");
    }
    throw err;
  }

  await logWaAudit({
    workspaceId: ctx.workspace.id,
    userId: ctx.userId,
    action: "view_dashboard",
  });

  const supabase = await getSupabaseServerClient();
  const [conversationsResult, instancesResult] = await Promise.all([
    getConversationsAction({ page: 1 }),
    supabase
      .from("wa_instances")
      .select("id, display_name")
      .eq("workspace_id", ctx.workspace.id)
      .order("display_name"),
  ]);

  const initialConversations =
    "conversations" in conversationsResult ? conversationsResult.conversations : [];
  const instances = (instancesResult.data ?? []).map((instance) => ({
    id: instance.id,
    displayName: instance.display_name,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Conversas monitoradas em todas as instâncias do workspace.
        </p>
      </div>
      <ConversationList initialConversations={initialConversations} instances={instances} />
    </div>
  );
}

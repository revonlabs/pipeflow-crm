import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { requireWaAdmin, WaAccessDeniedError } from "@/lib/wa/auth";
import { logWaAudit } from "@/lib/wa/audit";
import { EmptyState } from "@/components/shared/empty-state";

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

  return (
    <EmptyState
      icon={MessageCircle}
      title="Módulo WhatsApp — em construção"
      description="O monitoramento de conversas, instâncias e métricas chega nos próximos sprints. A fundação (segurança, isolamento por workspace e auditoria) já está pronta."
    />
  );
}

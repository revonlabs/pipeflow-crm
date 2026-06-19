import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/workspace";
import { getWorkspaceLostReasons } from "@/lib/actions/lost-reasons";
import { LostReasonsList } from "@/components/settings/lost-reasons-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LostReasonsPage() {
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/onboarding");

  const reasons = await getWorkspaceLostReasons(ctx.workspace.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Motivos de Perda</CardTitle>
        <CardDescription>
          Cadastre os motivos que sua equipe pode selecionar ao marcar um negócio como perdido.
          Apenas administradores podem criar ou excluir motivos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LostReasonsList reasons={reasons} isAdmin={ctx.role === "admin"} />
      </CardContent>
    </Card>
  );
}

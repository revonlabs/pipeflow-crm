import { redirect } from "next/navigation";
import { requireWaAdmin, WaAccessDeniedError } from "@/lib/wa/auth";
import { getInstancesAction } from "@/lib/actions/wa-instances";
import { InstanceList } from "@/components/wa/instance-list";
import { WaSubnav } from "@/components/wa/wa-subnav";

export default async function WaInstancesPage() {
  let ctx;
  try {
    ctx = await requireWaAdmin();
  } catch (err) {
    if (err instanceof WaAccessDeniedError) {
      redirect("/dashboard");
    }
    throw err;
  }

  const result = await getInstancesAction();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Instâncias — WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Conecte números de WhatsApp ao workspace escaneando o QR code.
        </p>
      </div>
      <WaSubnav />
      {"error" in result ? (
        <p className="text-sm text-crm-negative">{result.error}</p>
      ) : (
        <InstanceList workspaceId={ctx.workspace.id} initialInstances={result.instances} />
      )}
    </div>
  );
}

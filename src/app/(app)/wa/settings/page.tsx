import { redirect } from "next/navigation";
import { requireWaAdmin, WaAccessDeniedError } from "@/lib/wa/auth";
import { getDigestConfigAction } from "@/lib/actions/wa-settings";
import { WaDigestSettingsForm } from "@/components/wa/wa-digest-settings-form";
import { WaSubnav } from "@/components/wa/wa-subnav";

export default async function WaSettingsPage() {
  try {
    await requireWaAdmin();
  } catch (err) {
    if (err instanceof WaAccessDeniedError) {
      redirect("/dashboard");
    }
    throw err;
  }

  const result = await getDigestConfigAction();
  if ("error" in result) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold">Configurações — WhatsApp</h1>
        <WaSubnav />
        <p className="text-sm text-red-400">{result.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Configurações — WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Defina o horário e o período do resumo diário enviado por e-mail.
        </p>
      </div>
      <WaSubnav />
      <div className="max-w-lg">
        <WaDigestSettingsForm config={result.config} />
      </div>
    </div>
  );
}

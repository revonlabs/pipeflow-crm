"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireWaAdmin } from "@/lib/wa/auth";
import { logWaAudit } from "@/lib/wa/audit";

// LGPD — direito ao esquecimento (spec §2). Sem componente de UI ainda
// (Sprint 6, decisão deliberada): uso manual via suporte por ora. A function
// wa_anonymize_contact_rpc zera display_name/phone_number/profile_pic_url e
// marca anonymized_at; o worker de retenção (Sprint 6) limpa a mídia física
// das mensagens desse contato 30 dias depois.
export async function anonymizeContactAction(
  contactId: string
): Promise<{ success: true } | { error: string }> {
  let workspaceId: string;
  let userId: string;
  try {
    ({ workspace: { id: workspaceId }, userId } = await requireWaAdmin());
  } catch {
    return { error: "Acesso negado" };
  }

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.rpc("wa_anonymize_contact_rpc", {
    p_contact_id: contactId,
    p_workspace_id: workspaceId,
  });

  if (error) {
    return { error: "Não foi possível anonimizar o contato" };
  }

  await logWaAudit({
    workspaceId,
    userId,
    action: "contact_anonymized",
    targetType: "contact",
    targetId: contactId,
  });

  return { success: true };
}

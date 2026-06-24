"use server";

import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireWaAdmin } from "@/lib/wa/auth";
import { logWaAudit } from "@/lib/wa/audit";

export interface WaDigestConfig {
  scheduleTime: string;
  periodHours: 24 | 48 | 168;
  enabled: boolean;
  lastSentAt: string | null;
}

interface DigestConfigRpcRow {
  schedule_time: string;
  period_hours: number;
  enabled: boolean;
  last_sent_at: string | null;
}

export async function getDigestConfigAction(): Promise<
  { config: WaDigestConfig } | { error: string }
> {
  let workspaceId: string;
  try {
    ({ workspace: { id: workspaceId } } = await requireWaAdmin());
  } catch {
    return { error: "Acesso negado" };
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.rpc("wa_get_digest_config_rpc", {
    p_workspace_id: workspaceId,
  });

  if (error) {
    return { error: "Não foi possível carregar a configuração" };
  }

  const row = ((data ?? []) as DigestConfigRpcRow[])[0];

  return {
    config: row
      ? {
          scheduleTime: row.schedule_time.slice(0, 5),
          periodHours: row.period_hours as 24 | 48 | 168,
          enabled: row.enabled,
          lastSentAt: row.last_sent_at,
        }
      : { scheduleTime: "18:00", periodHours: 24, enabled: false, lastSentAt: null },
  };
}

const updateDigestConfigSchema = z.object({
  scheduleTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
  periodHours: z.union([z.literal(24), z.literal(48), z.literal(168)]),
  enabled: z.boolean(),
});

export async function updateDigestConfigAction(
  values: z.infer<typeof updateDigestConfigSchema>
): Promise<{ error?: string }> {
  const parsed = updateDigestConfigSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  let workspaceId: string;
  let userId: string;
  try {
    ({ workspace: { id: workspaceId }, userId } = await requireWaAdmin());
  } catch {
    return { error: "Acesso negado" };
  }

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.rpc("wa_upsert_digest_config_rpc", {
    p_workspace_id: workspaceId,
    p_schedule_time: `${parsed.data.scheduleTime}:00`,
    p_period_hours: parsed.data.periodHours,
    p_enabled: parsed.data.enabled,
  });

  if (error) {
    return { error: "Não foi possível salvar a configuração" };
  }

  await logWaAudit({
    workspaceId,
    userId,
    action: "change_settings",
    targetType: "digest_config",
  });

  return {};
}

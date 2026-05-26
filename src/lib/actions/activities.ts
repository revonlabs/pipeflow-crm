"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";

const ACTIVITY_TYPES = ["call", "email", "meeting", "note"] as const;

const activitySchema = z.object({
  leadId: z.string().uuid("leadId inválido"),
  type: z.enum(ACTIVITY_TYPES),
  description: z.string().min(1, "Descrição é obrigatória").max(5000),
});

export async function createActivityAction(
  leadId: string,
  type: string,
  description: string
) {
  const parsed = activitySchema.safeParse({ leadId, type, description });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  // Garante que o lead pertence ao workspace (previne referência cruzada)
  const { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq("id", parsed.data.leadId)
    .eq("workspace_id", ctx.workspace.id)
    .maybeSingle();

  if (!lead) return { error: "Lead não encontrado" };

  const { error } = await supabase.from("activities").insert({
    workspace_id: ctx.workspace.id,
    lead_id: parsed.data.leadId,
    type: parsed.data.type,
    description: parsed.data.description,
    author_id: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/leads/${parsed.data.leadId}`);
  return { success: true };
}

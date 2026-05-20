"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import type { ActivityType } from "@/types";

export async function createActivityAction(
  leadId: string,
  type: ActivityType,
  description: string
) {
  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase.from("activities").insert({
    workspace_id: ctx.workspace.id,
    lead_id: leadId,
    type,
    description,
    author_id: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

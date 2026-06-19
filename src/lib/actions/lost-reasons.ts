"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { isAdmin } from "@/lib/permissions";
import type { LostReason } from "@/types";

const createLostReasonSchema = z.object({
  name: z.string().trim().min(1, "Nome do motivo é obrigatório").max(100),
});

const deleteLostReasonSchema = z.object({
  id: z.string().uuid(),
});

export async function getWorkspaceLostReasons(workspaceId: string): Promise<LostReason[]> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("lost_reasons")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });
  return data ?? [];
}

export async function createLostReasonAction(
  name: string
): Promise<{ error: string } | { success: true; reason: LostReason }> {
  const parsed = createLostReasonSchema.safeParse({ name });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  if (!(await isAdmin(ctx.workspace.id))) {
    return { error: "Apenas administradores podem gerenciar motivos de perda." };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("lost_reasons")
    .upsert(
      { workspace_id: ctx.workspace.id, name: parsed.data.name },
      { onConflict: "workspace_id,name" }
    )
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/settings/lost-reasons");
  return { success: true, reason: data };
}

export async function deleteLostReasonAction(id: string) {
  const parsed = deleteLostReasonSchema.safeParse({ id });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  if (!(await isAdmin(ctx.workspace.id))) {
    return { error: "Apenas administradores podem gerenciar motivos de perda." };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("lost_reasons")
    .delete()
    .eq("id", parsed.data.id)
    .eq("workspace_id", ctx.workspace.id);

  if (error) return { error: error.message };

  revalidatePath("/settings/lost-reasons");
  return { success: true };
}

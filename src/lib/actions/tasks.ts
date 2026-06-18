"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";

const createTaskSchema = z.object({
  deal_id: z.string().uuid("deal_id inválido"),
  due_at: z.string().min(1, "Data/hora é obrigatória"),
  title: z.string().min(1).max(255).optional(),
});

async function verifyDealOwnership(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>, dealId: string, workspaceId: string) {
  const { data } = await supabase
    .from("deals")
    .select("id")
    .eq("id", dealId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return !!data;
}

export async function createTaskAction(payload: unknown) {
  const parsed = createTaskSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  const dealExists = await verifyDealOwnership(supabase, parsed.data.deal_id, ctx.workspace.id);
  if (!dealExists) return { error: "Negociação não encontrada" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("tasks").insert({
    workspace_id: ctx.workspace.id,
    deal_id: parsed.data.deal_id,
    due_at: parsed.data.due_at,
    title: parsed.data.title ?? "Próximo contato",
    created_by: user?.id ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function completeTaskAction(id: string) {
  if (!id || typeof id !== "string") return { error: "ID inválido" };

  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  const { error } = await supabase
    .from("tasks")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id);

  if (error) return { error: error.message };

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTaskAction(id: string) {
  if (!id || typeof id !== "string") return { error: "ID inválido" };

  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id);

  if (error) return { error: error.message };

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { success: true };
}

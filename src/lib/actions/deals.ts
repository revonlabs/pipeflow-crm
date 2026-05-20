"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import type { DealStage } from "@/types";

interface DealPayload {
  title: string;
  lead_id: string;
  value?: number | null;
  stage: DealStage;
  owner_id?: string | null;
  due_date?: string | null;
}

export async function createDealAction(payload: DealPayload) {
  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  // Calcula próxima posição na coluna
  const { count } = await supabase
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ctx.workspace.id)
    .eq("stage", payload.stage);

  const { error } = await supabase.from("deals").insert({
    workspace_id: ctx.workspace.id,
    title: payload.title,
    lead_id: payload.lead_id,
    value: payload.value ?? null,
    stage: payload.stage,
    owner_id: payload.owner_id ?? null,
    due_date: payload.due_date ?? null,
    position: count ?? 0,
  });

  if (error) return { error: error.message };

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateDealAction(id: string, payload: DealPayload) {
  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  const { error } = await supabase
    .from("deals")
    .update({
      title: payload.title,
      lead_id: payload.lead_id,
      value: payload.value ?? null,
      stage: payload.stage,
      owner_id: payload.owner_id ?? null,
      due_date: payload.due_date ?? null,
    })
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id);

  if (error) return { error: error.message };

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function moveDealAction(
  id: string,
  stage: DealStage,
  position: number
) {
  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  const { error } = await supabase
    .from("deals")
    .update({ stage, position })
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id);

  if (error) return { error: error.message };

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteDealAction(id: string) {
  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  const { error } = await supabase
    .from("deals")
    .delete()
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id);

  if (error) return { error: error.message };

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { success: true };
}

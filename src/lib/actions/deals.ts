"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";

const DEAL_STAGES = ["new_lead", "contacted", "proposal_sent", "negotiation", "won", "lost"] as const;

const dealSchema = z
  .object({
    title: z.string().min(1, "Título é obrigatório").max(255),
    lead_id: z.string().uuid("lead_id inválido"),
    recurring_value: z.number().min(0).nullable().optional(),
    setup_value: z.number().min(0).nullable().optional(),
    stage: z.enum(DEAL_STAGES),
    owner_id: z.string().uuid().nullable().optional(),
    due_date: z.string().nullable().optional(),
    lost_reason_id: z.string().uuid().nullable().optional(),
  })
  .refine((data) => data.stage !== "lost" || !!data.lost_reason_id, {
    message: "Selecione um motivo de perda",
    path: ["lost_reason_id"],
  });

const moveSchema = z
  .object({
    id: z.string().uuid(),
    stage: z.enum(DEAL_STAGES),
    position: z.number().int().min(0),
    lost_reason_id: z.string().uuid().nullable().optional(),
  })
  .refine((data) => data.stage !== "lost" || !!data.lost_reason_id, {
    message: "Selecione um motivo de perda",
    path: ["lost_reason_id"],
  });

async function verifyLeadOwnership(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>, leadId: string, workspaceId: string) {
  const { data } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return !!data;
}

export async function createDealAction(payload: unknown) {
  const parsed = dealSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  // Garante que o lead pertence ao workspace (previne referência cruzada)
  const leadExists = await verifyLeadOwnership(supabase, parsed.data.lead_id, ctx.workspace.id);
  if (!leadExists) return { error: "Lead não encontrado" };

  const { count } = await supabase
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ctx.workspace.id)
    .eq("stage", parsed.data.stage);

  const recurring_value = parsed.data.recurring_value ?? 0;
  const setup_value = parsed.data.setup_value ?? 0;

  const { error } = await supabase.from("deals").insert({
    workspace_id: ctx.workspace.id,
    title: parsed.data.title,
    lead_id: parsed.data.lead_id,
    recurring_value,
    setup_value,
    value: recurring_value + setup_value,
    stage: parsed.data.stage,
    owner_id: parsed.data.owner_id ?? null,
    due_date: parsed.data.due_date ?? null,
    lost_reason_id: parsed.data.stage === "lost" ? parsed.data.lost_reason_id ?? null : null,
    position: count ?? 0,
  });

  if (error) return { error: error.message };

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateDealAction(id: string, payload: unknown) {
  if (!id || typeof id !== "string") return { error: "ID inválido" };

  const parsed = dealSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  // Garante que o lead pertence ao workspace
  const leadExists = await verifyLeadOwnership(supabase, parsed.data.lead_id, ctx.workspace.id);
  if (!leadExists) return { error: "Lead não encontrado" };

  const recurring_value = parsed.data.recurring_value ?? 0;
  const setup_value = parsed.data.setup_value ?? 0;

  const { error } = await supabase
    .from("deals")
    .update({
      title: parsed.data.title,
      lead_id: parsed.data.lead_id,
      recurring_value,
      setup_value,
      value: recurring_value + setup_value,
      stage: parsed.data.stage,
      owner_id: parsed.data.owner_id ?? null,
      due_date: parsed.data.due_date ?? null,
      lost_reason_id: parsed.data.stage === "lost" ? parsed.data.lost_reason_id ?? null : null,
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
  stage: string,
  position: number,
  lostReasonId?: string | null
) {
  const parsed = moveSchema.safeParse({ id, stage, position, lost_reason_id: lostReasonId });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  const { error } = await supabase
    .from("deals")
    .update({
      stage: parsed.data.stage,
      position: parsed.data.position,
      lost_reason_id: parsed.data.stage === "lost" ? parsed.data.lost_reason_id ?? null : null,
    })
    .eq("id", parsed.data.id)
    .eq("workspace_id", ctx.workspace.id);

  if (error) return { error: error.message };

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteDealAction(id: string) {
  if (!id || typeof id !== "string") return { error: "ID inválido" };

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

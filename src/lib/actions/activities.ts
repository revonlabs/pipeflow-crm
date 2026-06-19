"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { getWorkspaceMembers } from "@/lib/members";
import type { Activity, ActivityType } from "@/types";

const ACTIVITY_TYPES = ["call", "email", "meeting", "note"] as const;

const activitySchema = z.object({
  leadId: z.string().uuid("leadId inválido"),
  dealId: z.string().uuid("dealId inválido"),
  type: z.enum(ACTIVITY_TYPES),
  description: z.string().min(1, "Descrição é obrigatória").max(5000),
});

async function verifyDealOwnership(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  dealId: string,
  leadId: string,
  workspaceId: string
) {
  const { data } = await supabase
    .from("deals")
    .select("id")
    .eq("id", dealId)
    .eq("lead_id", leadId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return !!data;
}

export async function createActivityAction(
  leadId: string,
  dealId: string,
  type: string,
  description: string
) {
  const parsed = activitySchema.safeParse({ leadId, dealId, type, description });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  // Garante que o deal pertence ao lead e ao workspace (previne referência cruzada)
  const dealExists = await verifyDealOwnership(supabase, parsed.data.dealId, parsed.data.leadId, ctx.workspace.id);
  if (!dealExists) return { error: "Negócio não encontrado" };

  const { error } = await supabase.from("activities").insert({
    workspace_id: ctx.workspace.id,
    lead_id: parsed.data.leadId,
    deal_id: parsed.data.dealId,
    type: parsed.data.type,
    description: parsed.data.description,
    author_id: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/leads/${parsed.data.leadId}`);
  revalidatePath("/pipeline");
  return { success: true };
}

export async function getDealActivities(dealId: string, workspaceId: string): Promise<Activity[]> {
  const supabase = await getSupabaseServerClient();
  const [{ data }, members] = await Promise.all([
    supabase
      .from("activities")
      .select("*")
      .eq("deal_id", dealId)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    getWorkspaceMembers(workspaceId),
  ]);

  const memberMap = new Map(members.map((m) => [m.id, m]));

  return (data ?? []).map((a) => {
    const author = a.author_id ? memberMap.get(a.author_id) : undefined;
    return {
      ...a,
      type: a.type as ActivityType,
      author: author
        ? { id: author.id, email: author.email, user_metadata: { full_name: author.name } }
        : undefined,
    };
  });
}

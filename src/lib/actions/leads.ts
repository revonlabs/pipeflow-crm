"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { canAddLead } from "@/lib/limits";
import type { LeadStatus } from "@/types";

interface LeadPayload {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  status: LeadStatus;
  owner_id?: string;
}

export async function createLeadAction(payload: LeadPayload) {
  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { allowed, current, limit } = await canAddLead();
  if (!allowed) {
    return { error: `Limite de ${limit} leads atingido no plano Free. Faça upgrade para Pro para adicionar mais.`, limitReached: true, current, limit };
  }

  const { error } = await supabase.from("leads").insert({
    workspace_id: ctx.workspace.id,
    name: payload.name,
    email: payload.email,
    phone: payload.phone || null,
    company: payload.company || null,
    role: payload.role || null,
    status: payload.status,
    owner_id: payload.owner_id || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/leads");
  return { success: true };
}

export async function updateLeadAction(id: string, payload: LeadPayload) {
  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  const { error } = await supabase
    .from("leads")
    .update({
      name: payload.name,
      email: payload.email,
      phone: payload.phone || null,
      company: payload.company || null,
      role: payload.role || null,
      status: payload.status,
      owner_id: payload.owner_id || null,
    })
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id);

  if (error) return { error: error.message };

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { success: true };
}

export async function deleteLeadAction(id: string) {
  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id);

  if (error) return { error: error.message };

  revalidatePath("/leads");
  return { success: true };
}

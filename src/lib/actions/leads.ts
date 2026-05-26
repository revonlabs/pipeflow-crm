"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { canAddLead } from "@/lib/limits";

const LEAD_STATUSES = ["active", "inactive", "converted", "lost"] as const;

const leadSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  email: z.string().email("E-mail inválido"),
  phone: z.string().max(30).optional(),
  company: z.string().max(255).optional(),
  role: z.string().max(255).optional(),
  status: z.enum(LEAD_STATUSES),
  owner_id: z.string().uuid().optional().nullable(),
});

export async function createLeadAction(payload: unknown) {
  const parsed = leadSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { allowed, current, limit } = await canAddLead();
  if (!allowed) {
    return { error: `Limite de ${limit} leads atingido no plano Free. Faça upgrade para Pro para adicionar mais.`, limitReached: true, current, limit };
  }

  const data = parsed.data;
  const { error } = await supabase.from("leads").insert({
    workspace_id: ctx.workspace.id,
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    company: data.company || null,
    role: data.role || null,
    status: data.status,
    owner_id: data.owner_id || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/leads");
  return { success: true };
}

export async function updateLeadAction(id: string, payload: unknown) {
  if (!id || typeof id !== "string") return { error: "ID inválido" };

  const parsed = leadSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  const data = parsed.data;
  const { error } = await supabase
    .from("leads")
    .update({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      company: data.company || null,
      role: data.role || null,
      status: data.status,
      owner_id: data.owner_id || null,
    })
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id);

  if (error) return { error: error.message };

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { success: true };
}

export async function deleteLeadAction(id: string) {
  if (!id || typeof id !== "string") return { error: "ID inválido" };

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

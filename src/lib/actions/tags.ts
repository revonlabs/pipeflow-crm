"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import type { Tag } from "@/types";

const createTagSchema = z.object({
  name: z.string().trim().min(1, "Nome da tag é obrigatório").max(50),
});

const setLeadTagsSchema = z.object({
  leadId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()),
});

export async function getWorkspaceTags(workspaceId: string): Promise<Tag[]> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("tags")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });
  return data ?? [];
}

export async function createTagAction(name: string): Promise<{ error: string } | { success: true; tag: Tag }> {
  const parsed = createTagSchema.safeParse({ name });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  const { data, error } = await supabase
    .from("tags")
    .upsert(
      { workspace_id: ctx.workspace.id, name: parsed.data.name },
      { onConflict: "workspace_id,name" }
    )
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/leads");
  return { success: true, tag: data };
}

export async function setLeadTagsAction(leadId: string, tagIds: string[]) {
  const parsed = setLeadTagsSchema.safeParse({ leadId, tagIds });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await getSupabaseServerClient();
  const ctx = await getWorkspaceContext();
  if (!ctx) return { error: "Workspace não encontrado" };

  const { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq("id", parsed.data.leadId)
    .eq("workspace_id", ctx.workspace.id)
    .maybeSingle();
  if (!lead) return { error: "Lead não encontrado" };

  const { error: deleteError } = await supabase
    .from("lead_tags")
    .delete()
    .eq("lead_id", parsed.data.leadId);
  if (deleteError) return { error: deleteError.message };

  if (parsed.data.tagIds.length > 0) {
    const { error: insertError } = await supabase
      .from("lead_tags")
      .insert(parsed.data.tagIds.map((tagId) => ({ lead_id: parsed.data.leadId, tag_id: tagId })));
    if (insertError) return { error: insertError.message };
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${parsed.data.leadId}`);
  return { success: true };
}

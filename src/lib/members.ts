import 'server-only'
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface MemberInfo {
  id: string;
  name: string;
  email: string;
}

/**
 * Retorna membros do workspace com nome e email resolvidos via auth.admin.
 * Usado em Server Components e Server Actions.
 */
export async function getWorkspaceMembers(workspaceId: string): Promise<MemberInfo[]> {
  const supabase = await getSupabaseServerClient();

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId);

  if (!memberships || memberships.length === 0) return [];

  const admin = getSupabaseAdminClient();
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });

  const memberIds = new Set(memberships.map((m) => m.user_id));

  return users
    .filter((u) => memberIds.has(u.id))
    .map((u) => ({
      id: u.id,
      name: (u.user_metadata?.full_name as string | undefined) ?? u.email ?? u.id,
      email: u.email ?? "",
    }));
}

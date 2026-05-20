import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { WorkspaceRole } from '@/types'

export async function getMemberRole(workspaceId: string): Promise<WorkspaceRole | null> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  return (data?.role as WorkspaceRole) ?? null
}

export async function isAdmin(workspaceId: string): Promise<boolean> {
  const role = await getMemberRole(workspaceId)
  return role === 'admin'
}

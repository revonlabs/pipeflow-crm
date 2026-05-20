import { cookies } from 'next/headers'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Workspace, WorkspaceRole } from '@/types'

const ACTIVE_WORKSPACE_COOKIE = 'pf_active_workspace'

export interface WorkspaceContext {
  workspace: Workspace
  role: WorkspaceRole
  allWorkspaces: Workspace[]
}

/**
 * Carrega o workspace ativo + todos os workspaces do usuário.
 * Retorna null se o usuário não tem nenhum workspace → redirecionar para /onboarding.
 */
export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
  const supabase = await getSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Todos os workspaces do usuário com o role
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('role, workspace:workspaces(*)')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) return null

  const allWorkspaces = memberships.map((m) => m.workspace as Workspace)

  // Descobre o workspace ativo pelo cookie
  const cookieStore = await cookies()
  const activeId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value

  const activeMembership =
    memberships.find((m) => (m.workspace as Workspace).id === activeId) ??
    memberships[0]

  return {
    workspace: activeMembership.workspace as Workspace,
    role: activeMembership.role as WorkspaceRole,
    allWorkspaces,
  }
}

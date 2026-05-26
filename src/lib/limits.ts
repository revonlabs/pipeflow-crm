import 'server-only'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getWorkspaceContext } from '@/lib/workspace'

export const PLAN_LIMITS = {
  free: { leads: 50, members: 2 },
  pro: { leads: Infinity, members: Infinity },
  payment_failed: { leads: 50, members: 2 },
} as const

export async function canAddLead(): Promise<{ allowed: boolean; current: number; limit: number }> {
  const supabase = await getSupabaseServerClient()
  const ctx = await getWorkspaceContext()
  if (!ctx) return { allowed: false, current: 0, limit: 0 }

  const limit = PLAN_LIMITS[ctx.workspace.plan].leads

  if (limit === Infinity) return { allowed: true, current: 0, limit: Infinity }

  const { count } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', ctx.workspace.id)

  const current = count ?? 0
  return { allowed: current < limit, current, limit }
}

export async function canAddMember(): Promise<{ allowed: boolean; current: number; limit: number }> {
  const supabase = await getSupabaseServerClient()
  const ctx = await getWorkspaceContext()
  if (!ctx) return { allowed: false, current: 0, limit: 0 }

  const limit = PLAN_LIMITS[ctx.workspace.plan].members

  if (limit === Infinity) return { allowed: true, current: 0, limit: Infinity }

  const { count } = await supabase
    .from('workspace_members')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', ctx.workspace.id)

  const current = count ?? 0
  return { allowed: current < limit, current, limit }
}

import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceContext } from '@/lib/workspace'
import { MembersList } from '@/components/settings/members-list'
import { PendingInvitesList } from '@/components/settings/pending-invites-list'
import { InviteMemberDialog } from '@/components/settings/invite-member-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import type { Invite } from '@/types'

const FREE_MEMBER_LIMIT = 2

export default async function MembersPage() {
  const ctx = await getWorkspaceContext()
  if (!ctx) redirect('/onboarding')

  const { workspace, role } = ctx
  const adminUser = role === 'admin'

  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Carrega memberships
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('id, user_id, role, created_at')
    .eq('workspace_id', workspace.id)
    .order('created_at')

  // Resolve nomes e e-mails via admin
  const admin = getSupabaseAdminClient()
  const { data: { users: allUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const usersById = new Map(allUsers.map((u) => [u.id, u]))

  const members = (memberships ?? []).map((m) => {
    const u = usersById.get(m.user_id)
    return {
      id: m.id,
      user_id: m.user_id,
      role: m.role as 'admin' | 'member',
      email: u?.email ?? '',
      name: (u?.user_metadata?.full_name as string | undefined) ?? u?.email ?? m.user_id,
    }
  })

  // Convites pendentes
  const { data: invitesRaw } = await supabase
    .from('workspace_invites')
    .select('*')
    .eq('workspace_id', workspace.id)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  const invites = (invitesRaw ?? []) as Invite[]

  const atFreeLimit = workspace.plan === 'free' && members.length >= FREE_MEMBER_LIMIT

  return (
    <div className="space-y-6">
      {atFreeLimit && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Você atingiu o limite de {FREE_MEMBER_LIMIT} membros do plano Free.{' '}
            <a href="/settings/billing" className="font-medium underline underline-offset-2">
              Faça upgrade para Pro
            </a>{' '}
            para adicionar membros ilimitados.
          </span>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Membros</CardTitle>
            <CardDescription>
              {members.length} {members.length === 1 ? 'membro' : 'membros'}
              {workspace.plan === 'free' && ` de ${FREE_MEMBER_LIMIT}`}
            </CardDescription>
          </div>
          {adminUser && !atFreeLimit && <InviteMemberDialog />}
        </CardHeader>
        <CardContent className="space-y-6">
          <MembersList
            members={members}
            currentUserId={user.id}
            isCurrentUserAdmin={adminUser}
          />

          {invites.length > 0 && (
            <PendingInvitesList invites={invites} isAdmin={adminUser} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

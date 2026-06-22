import { notFound } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/platform-admin'
import { CreateClientDialog } from '@/components/settings/create-client-dialog'
import { ClientsList } from '@/components/settings/clients-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Workspace } from '@/types'

export default async function ClientsPage() {
  if (!(await isPlatformAdmin())) notFound()

  const supabase = await getSupabaseServerClient()

  const { data: workspacesRaw } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: false })

  const workspaces = (workspacesRaw ?? []) as Workspace[]

  const { data: memberCounts } = await supabase
    .from('workspace_members')
    .select('workspace_id')

  const countsByWorkspace = new Map<string, number>()
  for (const row of memberCounts ?? []) {
    countsByWorkspace.set(row.workspace_id, (countsByWorkspace.get(row.workspace_id) ?? 0) + 1)
  }

  const clients = workspaces.map((w) => ({
    workspace: w,
    memberCount: countsByWorkspace.get(w.id) ?? 0,
  }))

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>
            {clients.length} {clients.length === 1 ? 'workspace' : 'workspaces'} na plataforma
          </CardDescription>
        </div>
        <CreateClientDialog />
      </CardHeader>
      <CardContent>
        <ClientsList clients={clients} />
      </CardContent>
    </Card>
  )
}

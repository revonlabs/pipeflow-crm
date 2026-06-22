'use client'

import { useTransition } from 'react'
import { Loader2, Trash2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { ClientPlanSelect } from '@/components/settings/client-plan-select'
import { InviteClientUserDialog } from '@/components/settings/invite-client-user-dialog'
import { deleteClientWorkspaceAction } from '@/lib/actions/platform-admin'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Workspace } from '@/types'

interface ClientRow {
  workspace: Workspace
  memberCount: number
}

export function ClientsList({ clients }: { clients: ClientRow[] }) {
  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Nenhum workspace cadastrado"
        description="Crie o primeiro workspace de cliente para começar."
      />
    )
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {clients.map(({ workspace, memberCount }) => (
        <ClientRowItem key={workspace.id} workspace={workspace} memberCount={memberCount} />
      ))}
    </div>
  )
}

function ClientRowItem({ workspace, memberCount }: ClientRow) {
  const [isPending, startTransition] = useTransition()

  const createdAgo = formatDistanceToNow(new Date(workspace.created_at), { locale: ptBR, addSuffix: true })

  function handleDelete() {
    startTransition(async () => {
      await deleteClientWorkspaceAction(workspace.id)
    })
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800">
        <Building2 className="h-4 w-4 text-zinc-400" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{workspace.name}</p>
        <p className="text-xs text-muted-foreground">
          {memberCount} {memberCount === 1 ? 'membro' : 'membros'} · criado {createdAgo}
        </p>
      </div>

      <ClientPlanSelect workspaceId={workspace.id} plan={workspace.plan} />

      <InviteClientUserDialog workspaceId={workspace.id} workspaceName={workspace.name} />

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-red-400" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              O workspace <strong>{workspace.name}</strong> e todos os seus dados (leads, negócios, membros)
              serão permanentemente excluídos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

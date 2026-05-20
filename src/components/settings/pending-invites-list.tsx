'use client'

import { useTransition } from 'react'
import { Loader2, Mail, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import { cancelInviteAction } from '@/lib/actions/workspaces'
import type { Invite } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PendingInvitesListProps {
  invites: Invite[]
  isAdmin: boolean
}

export function PendingInvitesList({ invites, isAdmin }: PendingInvitesListProps) {
  if (invites.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Convites pendentes</h3>
      <div className="divide-y divide-border rounded-lg border border-border">
        {invites.map((invite) => (
          <InviteRow key={invite.id} invite={invite} isAdmin={isAdmin} />
        ))}
      </div>
    </div>
  )
}

function InviteRow({ invite, isAdmin }: { invite: Invite; isAdmin: boolean }) {
  const [isPending, startTransition] = useTransition()

  const expiresIn = formatDistanceToNow(new Date(invite.expires_at), { locale: ptBR, addSuffix: true })

  function handleCancel() {
    startTransition(async () => {
      await cancelInviteAction(invite.id)
    })
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800">
        <Mail className="h-4 w-4 text-zinc-400" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{invite.email}</p>
        <p className="text-xs text-muted-foreground">Expira {expiresIn}</p>
      </div>

      <Badge variant="outline" className="shrink-0 text-muted-foreground">
        {invite.role === 'admin' ? 'Admin' : 'Membro'}
      </Badge>

      {isAdmin && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar convite?</AlertDialogTitle>
              <AlertDialogDescription>
                O convite para <strong>{invite.email}</strong> será cancelado. O link de aceite deixará de funcionar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">
                Cancelar convite
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

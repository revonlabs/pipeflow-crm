'use client'

import { useTransition } from 'react'
import { MoreHorizontal, Shield, User, Loader2, Crown } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { removeMemberAction, updateMemberRoleAction } from '@/lib/actions/workspaces'

interface MemberRow {
  id: string
  user_id: string
  role: 'admin' | 'member'
  email: string
  name: string
}

interface MembersListProps {
  members: MemberRow[]
  currentUserId: string
  isCurrentUserAdmin: boolean
}

export function MembersList({ members, currentUserId, isCurrentUserAdmin }: MembersListProps) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {members.map((member) => (
        <MemberRow
          key={member.id}
          member={member}
          isSelf={member.user_id === currentUserId}
          isCurrentUserAdmin={isCurrentUserAdmin}
        />
      ))}
    </div>
  )
}

function MemberRow({
  member,
  isSelf,
  isCurrentUserAdmin,
}: {
  member: MemberRow
  isSelf: boolean
  isCurrentUserAdmin: boolean
}) {
  const [isPending, startTransition] = useTransition()

  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  function handleRoleChange(newRole: 'admin' | 'member') {
    startTransition(async () => {
      await updateMemberRoleAction(member.id, newRole)
    })
  }

  function handleRemove() {
    startTransition(async () => {
      await removeMemberAction(member.id)
    })
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="bg-zinc-800 text-xs font-medium text-zinc-300">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {member.name}
          {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(você)</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
      </div>

      <Badge
        variant="outline"
        className={`shrink-0 gap-1 ${member.role === 'admin' ? 'border-[#FF7043]/30 text-[#FF7043]' : 'text-muted-foreground'}`}
      >
        {member.role === 'admin' ? <Crown className="h-3 w-3" /> : <User className="h-3 w-3" />}
        {member.role === 'admin' ? 'Admin' : 'Membro'}
      </Badge>

      {isCurrentUserAdmin && !isSelf && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {member.role === 'member' ? (
              <DropdownMenuItem onClick={() => handleRoleChange('admin')} className="gap-2">
                <Shield className="h-4 w-4" />
                Tornar administrador
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleRoleChange('member')} className="gap-2">
                <User className="h-4 w-4" />
                Rebaixar para membro
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="gap-2 text-red-400 focus:text-red-400"
                >
                  Remover do workspace
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover membro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>{member.name}</strong> perderá acesso imediatamente. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemove}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

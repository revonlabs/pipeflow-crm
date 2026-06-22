'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { inviteClientUserAction } from '@/lib/actions/platform-admin'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  role: z.enum(['admin', 'member']),
})
type FormValues = z.infer<typeof schema>

export function InviteClientUserDialog({ workspaceId, workspaceName }: { workspaceId: string; workspaceName: string }) {
  const [open, setOpen] = useState(false)
  const [serverMessage, setServerMessage] = useState<{ type: 'error' | 'warning'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'admin' },
  })

  function onSubmit(values: FormValues) {
    setServerMessage(null)
    startTransition(async () => {
      const result = await inviteClientUserAction(workspaceId, values.email, values.role)
      if (result.error) {
        setServerMessage({ type: 'error', text: result.error })
        return
      }
      if (result.warning) {
        setServerMessage({ type: 'warning', text: result.warning })
        return
      }
      reset()
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { reset(); setServerMessage(null) } }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Convidar usuário">
          <UserPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar usuário para {workspaceName}</DialogTitle>
          <DialogDescription>
            O convidado receberá um e-mail com o link de aceite. O convite expira em 7 dias.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="client-invite-email">E-mail</Label>
            <Input
              id="client-invite-email"
              type="email"
              placeholder="contato@cliente.com"
              disabled={isPending}
              className={errors.email ? 'border-red-500/60' : ''}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client-invite-role">Papel</Label>
            <Select
              defaultValue="admin"
              onValueChange={(v) => setValue('role', v as FormValues['role'])}
              disabled={isPending}
            >
              <SelectTrigger id="client-invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador — gerencia membros e configurações</SelectItem>
                <SelectItem value="member">Membro — acesso às funcionalidades do CRM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {serverMessage && (
            <p className={`text-sm rounded-lg px-3 py-2 border ${
              serverMessage.type === 'error'
                ? 'text-red-400 bg-red-500/10 border-red-500/20'
                : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
            }`}>
              {serverMessage.text}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar convite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

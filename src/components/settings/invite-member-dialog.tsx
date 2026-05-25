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
import { inviteMemberAction } from '@/lib/actions/workspaces'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  role: z.enum(['admin', 'member']),
})
type FormValues = z.infer<typeof schema>

export function InviteMemberDialog() {
  const [open, setOpen] = useState(false)
  const [serverMessage, setServerMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'member' },
  })

  function onSubmit(values: FormValues) {
    setServerMessage(null)
    startTransition(async () => {
      const result = await inviteMemberAction(values.email, values.role)
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
        <Button className="gap-2 bg-[#CAFF33] text-[#0C0C0E] hover:bg-[#b8eb2d]">
          <UserPlus className="h-4 w-4" />
          Convidar membro
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar membro</DialogTitle>
          <DialogDescription>
            O convidado receberá um e-mail com o link de aceite. O convite expira em 7 dias.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colega@empresa.com"
              disabled={isPending}
              className={errors.email ? 'border-red-500/60' : ''}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Papel</Label>
            <Select
              defaultValue="member"
              onValueChange={(v) => setValue('role', v as 'admin' | 'member')}
              disabled={isPending}
            >
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Membro — acesso às funcionalidades do CRM</SelectItem>
                <SelectItem value="admin">Administrador — gerencia membros e configurações</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {serverMessage && (
            <p className={`text-sm rounded-lg px-3 py-2 border ${
              serverMessage.type === 'error'
                ? 'text-red-400 bg-red-500/10 border-red-500/20'
                : serverMessage.type === 'warning'
                ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                : 'text-green-400 bg-green-500/10 border-green-500/20'
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

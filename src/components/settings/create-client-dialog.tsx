'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus } from 'lucide-react'
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
import { createClientWorkspaceAction } from '@/lib/actions/platform-admin'

const schema = z.object({
  name: z.string().min(1, 'Nome não pode ser vazio').max(255),
  plan: z.enum(['free', 'pro', 'payment_failed']),
})
type FormValues = z.infer<typeof schema>

export function CreateClientDialog() {
  const [open, setOpen] = useState(false)
  const [serverMessage, setServerMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { plan: 'pro' },
  })

  function onSubmit(values: FormValues) {
    setServerMessage(null)
    startTransition(async () => {
      const result = await createClientWorkspaceAction(values.name, values.plan)
      if (result.error) {
        setServerMessage(result.error)
        return
      }
      reset()
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { reset(); setServerMessage(null) } }}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-[#FF7043] text-[#060B14] hover:bg-[#FF7043]">
          <Plus className="h-4 w-4" />
          Novo cliente
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
          <DialogDescription>
            Cria um workspace para o cliente com o plano definido. Depois, convide o usuário do cliente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="client-name">Nome do workspace</Label>
            <Input
              id="client-name"
              placeholder="Empresa do Cliente"
              disabled={isPending}
              className={errors.name ? 'border-red-500/60' : ''}
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client-plan">Plano</Label>
            <Select
              defaultValue="pro"
              onValueChange={(v) => setValue('plan', v as FormValues['plan'])}
              disabled={isPending}
            >
              <SelectTrigger id="client-plan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {serverMessage && (
            <p className="text-sm rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-400">
              {serverMessage}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

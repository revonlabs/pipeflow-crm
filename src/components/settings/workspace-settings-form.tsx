'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateWorkspaceAction } from '@/lib/actions/workspaces'
import type { Workspace } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(50),
})
type FormValues = z.infer<typeof schema>

interface WorkspaceSettingsFormProps {
  workspace: Workspace
  isAdmin: boolean
}

export function WorkspaceSettingsForm({ workspace, isAdmin }: WorkspaceSettingsFormProps) {
  const [serverMessage, setServerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: workspace.name },
  })

  function onSubmit(values: FormValues) {
    setServerMessage(null)
    startTransition(async () => {
      const result = await updateWorkspaceAction(values.name)
      if (result.error) {
        setServerMessage({ type: 'error', text: result.error })
      } else {
        setServerMessage({ type: 'success', text: 'Workspace atualizado com sucesso.' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome do workspace</Label>
        <Input
          id="name"
          placeholder="Minha Empresa"
          disabled={!isAdmin || isPending}
          className={errors.name ? 'border-red-500/60' : ''}
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Slug</Label>
        <Input value={workspace.slug} disabled className="opacity-50" />
        <p className="text-xs text-muted-foreground">O slug não pode ser alterado após a criação.</p>
      </div>

      {serverMessage && (
        <p className={`text-sm rounded-lg px-3 py-2 border ${
          serverMessage.type === 'success'
            ? 'text-green-400 bg-green-500/10 border-green-500/20'
            : 'text-red-400 bg-red-500/10 border-red-500/20'
        }`}>
          {serverMessage.text}
        </p>
      )}

      {isAdmin && (
        <Button type="submit" disabled={!isDirty || isPending} className="gap-2">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar alterações
        </Button>
      )}
    </form>
  )
}

'use client'

import { useTransition } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateClientPlanAction } from '@/lib/actions/platform-admin'
import type { Plan } from '@/types'

export function ClientPlanSelect({ workspaceId, plan }: { workspaceId: string; plan: Plan }) {
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string) {
    startTransition(async () => {
      await updateClientPlanAction(workspaceId, value as Plan)
    })
  }

  return (
    <Select defaultValue={plan} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="h-8 w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="free">Free</SelectItem>
        <SelectItem value="pro">Pro</SelectItem>
        <SelectItem value="payment_failed">Pgto. falhou</SelectItem>
      </SelectContent>
    </Select>
  )
}

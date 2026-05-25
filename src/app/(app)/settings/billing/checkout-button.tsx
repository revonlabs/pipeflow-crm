'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { createCheckoutSessionAction } from '@/lib/actions/billing'
import { Loader2 } from 'lucide-react'

export function CheckoutButton() {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      onClick={() => startTransition(async () => { await createCheckoutSessionAction() })}
      disabled={pending}
      className="w-full"
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Assinar Pro — R$49/mês
    </Button>
  )
}

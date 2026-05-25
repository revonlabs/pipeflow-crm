'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { createPortalSessionAction } from '@/lib/actions/billing'
import { Loader2 } from 'lucide-react'

export function PortalButton() {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      onClick={() => startTransition(async () => { await createPortalSessionAction() })}
      disabled={pending}
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Gerenciar Assinatura
    </Button>
  )
}

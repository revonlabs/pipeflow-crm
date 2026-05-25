'use client'

import { useTransition } from 'react'
import { Loader2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface SwitchAccountButtonProps {
  token: string
}

export function SwitchAccountButton({ token }: SwitchAccountButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleSwitch() {
    startTransition(async () => {
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      window.location.href = `/login?invite=${token}`
    })
  }

  return (
    <Button
      variant="outline"
      onClick={handleSwitch}
      disabled={isPending}
      className="gap-2"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      Trocar de conta
    </Button>
  )
}

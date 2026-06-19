import { redirect } from 'next/navigation'
import { getWorkspaceContext } from '@/lib/workspace'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckoutButton } from './checkout-button'
import { PortalButton } from './portal-button'
import { Check, AlertTriangle, Zap } from 'lucide-react'
import type { Subscription } from '@/types'

const PLAN_FEATURES = {
  free: [
    '50 leads',
    '2 membros',
    '1 workspace',
    'Pipeline Kanban',
    'Dashboard básico',
  ],
  pro: [
    'Leads ilimitados',
    'Membros ilimitados',
    'Workspaces ilimitados',
    'Pipeline Kanban',
    'Dashboard completo',
    'Suporte prioritário',
  ],
}

interface BillingPageProps {
  searchParams: Promise<{ success?: string }>
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const ctx = await getWorkspaceContext()
  if (!ctx) redirect('/onboarding')

  const { workspace } = ctx
  const { success } = await searchParams

  const supabase = await getSupabaseServerClient()
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('workspace_id', workspace.id)
    .maybeSingle()

  const sub = subscription as Subscription | null
  const isPro = workspace.plan === 'pro'
  const isPaymentFailed = workspace.plan === 'payment_failed'

  return (
    <div className="space-y-6">
      {success === 'true' && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <Check className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-400">
            Assinatura ativada com sucesso! Bem-vindo ao Revon Studio CRM Pro.
          </AlertDescription>
        </Alert>
      )}

      {isPaymentFailed && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-400">
            Falha no pagamento da sua assinatura. Atualize seu método de pagamento para continuar com o Pro.{' '}
            <PortalButton />
          </AlertDescription>
        </Alert>
      )}

      {/* Plano atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Plano atual
            <Badge
              variant={isPro ? 'default' : 'secondary'}
              className={isPro ? 'bg-[#4F8EF7] text-white' : ''}
            >
              {isPro ? 'Pro' : isPaymentFailed ? 'Pagamento falhou' : 'Free'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isPro && sub?.current_period_end && (
            <p className="text-sm text-muted-foreground">
              Renova em{' '}
              {new Date(sub.current_period_end).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
          {isPro && <PortalButton />}
        </CardContent>
      </Card>

      {/* Comparação de planos */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Free */}
        <Card className={!isPro ? 'ring-2 ring-[#4F8EF7]' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Free
              {!isPro && <Badge variant="secondary">Atual</Badge>}
            </CardTitle>
            <p className="text-2xl font-bold">R$0<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {PLAN_FEATURES.free.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className={isPro ? 'ring-2 ring-[#4F8EF7]' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#4F8EF7]" />
              Pro
              {isPro && <Badge className="bg-[#4F8EF7] text-white">Atual</Badge>}
              {!isPro && <Badge variant="outline" className="border-[#4F8EF7] text-[#4F8EF7]">Popular</Badge>}
            </CardTitle>
            <p className="text-2xl font-bold">R$49<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {PLAN_FEATURES.pro.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 shrink-0 text-[#4F8EF7]" />
                  {f}
                </li>
              ))}
            </ul>
            {!isPro && <CheckoutButton />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

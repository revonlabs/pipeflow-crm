import { redirect } from 'next/navigation'
import { getWorkspaceContext } from '@/lib/workspace'
import { WorkspaceSettingsForm } from '@/components/settings/workspace-settings-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  payment_failed: 'Pagamento Pendente',
}

export default async function WorkspaceSettingsPage() {
  const ctx = await getWorkspaceContext()
  if (!ctx) redirect('/onboarding')

  const { workspace, role } = ctx
  const adminUser = role === 'admin'

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do workspace</CardTitle>
          <CardDescription>
            {adminUser ? 'Edite o nome do seu workspace.' : 'Apenas administradores podem editar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceSettingsForm workspace={workspace} isAdmin={adminUser} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plano atual</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Badge
            variant={workspace.plan === 'pro' ? 'default' : 'secondary'}
            className={workspace.plan === 'pro' ? 'bg-[#CAFF33] text-[#0C0C0E]' : ''}
          >
            {PLAN_LABELS[workspace.plan] ?? workspace.plan}
          </Badge>
          {workspace.plan === 'free' && (
            <p className="text-sm text-muted-foreground">
              Máximo de 2 membros e 50 leads. <a href="/settings/billing" className="text-[#CAFF33] hover:underline">Fazer upgrade para Pro</a>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

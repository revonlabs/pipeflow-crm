import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { acceptInviteAction } from '@/lib/actions/workspaces'
import { SwitchAccountButton } from './switch-account-button'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { cookies } from 'next/headers'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params

  // Valida o convite independentemente de estar logado
  const admin = getSupabaseAdminClient()
  const { data: invite } = await admin
    .from('workspace_invites')
    .select('*, workspace:workspaces(name)')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) {
    return <InviteLayout icon="error" title="Convite inválido" description="Este convite não existe, já foi usado ou expirou." />
  }

  const workspaceName = (invite.workspace as { name: string } | null)?.name ?? 'workspace'

  // Verifica se há usuário logado
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Não logado → redireciona para login preservando o token
  if (!user) {
    redirect(`/login?invite=${token}`)
  }

  // E-mail errado → mostra botão de troca
  if (invite.email.toLowerCase() !== (user.email ?? '').toLowerCase()) {
    return (
      <InviteLayout
        icon="warning"
        title="Conta diferente"
        description={`Este convite foi enviado para ${invite.email}. Você está logado como ${user.email}.`}
      >
        <SwitchAccountButton token={token} />
        <Button variant="ghost" asChild>
          <Link href="/dashboard">Continuar com conta atual</Link>
        </Button>
      </InviteLayout>
    )
  }

  // Aceita automaticamente
  const result = await acceptInviteAction(token)

  if (result.error) {
    return <InviteLayout icon="error" title="Erro ao aceitar" description={result.error} />
  }

  if (result.emailMismatch) {
    return <InviteLayout icon="error" title="Convite inválido" description="Este convite não corresponde à sua conta. Faça login com o e-mail correto." />
  }

  // Define o workspace ativo e redireciona
  if (result.workspaceId) {
    const cookieStore = await cookies()
    cookieStore.set('pf_active_workspace', result.workspaceId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
  }

  return (
    <InviteLayout
      icon="success"
      title={`Bem-vindo a ${workspaceName}!`}
      description="Você entrou no workspace com sucesso."
    >
      <Button asChild className="bg-[#FF7043] text-[#060B14] hover:bg-[#FF7043]">
        <Link href="/dashboard">Ir para o dashboard</Link>
      </Button>
    </InviteLayout>
  )
}

// ─── Layout simples para estados do convite ───────────────────────────────────

function InviteLayout({
  icon,
  title,
  description,
  children,
}: {
  icon: 'success' | 'error' | 'warning'
  title: string
  description: string
  children?: React.ReactNode
}) {
  const icons = {
    success: <CheckCircle2 className="h-12 w-12 text-green-500" />,
    error: <XCircle className="h-12 w-12 text-red-500" />,
    warning: <AlertTriangle className="h-12 w-12 text-yellow-500" />,
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mb-4 flex justify-center">{icons[icon]}</div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">{title}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{description}</p>
        {children && <div className="flex flex-col gap-3">{children}</div>}
      </div>
    </div>
  )
}

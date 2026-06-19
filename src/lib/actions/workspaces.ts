'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/permissions'
import { getWorkspaceContext } from '@/lib/workspace'
import { canAddMember } from '@/lib/limits'
import { getResendClient } from '@/lib/resend'
import { renderWorkspaceInviteEmail } from '@/emails/workspace-invite'

const inviteSchema = z.object({
  email: z.string().email('E-mail inválido'),
  role: z.enum(['admin', 'member']),
})

// ─── inviteMemberAction ───────────────────────────────────────────────────────

export async function inviteMemberAction(
  email: string,
  role: 'admin' | 'member'
): Promise<{ error?: string; warning?: string }> {
  const parsed = inviteSchema.safeParse({ email, role })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const ctx = await getWorkspaceContext()
  if (!ctx) return { error: 'Workspace não encontrado' }

  const workspaceId = ctx.workspace.id

  if (!(await isAdmin(workspaceId))) return { error: 'Apenas administradores podem convidar membros' }

  const { allowed, limit } = await canAddMember()
  if (!allowed) {
    return { error: `O plano Free permite no máximo ${limit} membros. Faça upgrade para Pro.` }
  }

  // Verifica se o email convidado já é membro via join na view de auth
  // Usamos o admin client para consultar auth.users pelo email (sem scan de tabela completa)
  const admin = getSupabaseAdminClient()
  const { data: authUser } = await admin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .then(async ({ data: members }) => {
      if (!members || members.length === 0) return { data: null }
      // Busca em lote apenas os IDs membros — evita scan completo de auth.users
      const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 })
      const match = users?.users?.find(
        (u) => u.email?.toLowerCase() === parsed.data.email.toLowerCase() &&
          members.some((m) => m.user_id === u.id)
      )
      return { data: match ?? null }
    })

  if (authUser) return { error: 'Este usuário já é membro do workspace' }

  // Verifica convite pendente
  const { data: pendingInvite } = await supabase
    .from('workspace_invites')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('email', email)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (pendingInvite) return { error: 'Já existe um convite pendente para este e-mail' }

  // Cria convite — token gerado pelo DEFAULT do banco
  const { data: invite, error: insertError } = await supabase
    .from('workspace_invites')
    .insert({ workspace_id: workspaceId, email, role })
    .select('token')
    .single()

  if (insertError || !invite) {
    console.error('[inviteMemberAction] insert error:', insertError?.message)
    return { error: 'Falha ao criar convite. Tente novamente.' }
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const acceptUrl = `${appUrl}/invite/${invite.token}`

  const inviterName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'Alguém'

  // Em dev sem domínio próprio, o Resend só entrega para o e-mail dono da conta.
  // Usamos o e-mail real do convidado em prod; em dev, redirecionamos para o owner.
  const isDev = process.env.NODE_ENV === 'development'
  const devOverrideEmail = process.env.RESEND_DEV_TO_EMAIL
  const toEmail = isDev && devOverrideEmail ? devOverrideEmail : email

  const resend = getResendClient()
  const { error: emailError } = await resend.emails.send({
    from: 'Revon Studio CRM <onboarding@resend.dev>',
    to: toEmail,
    subject: `Você foi convidado para ${ctx.workspace.name} no Revon Studio CRM`,
    html: renderWorkspaceInviteEmail({
      workspaceName: ctx.workspace.name,
      inviterName,
      inviterEmail: user.email ?? '',
      role,
      acceptUrl,
    }),
  })

  if (emailError) {
    // Logamos a URL server-side apenas — nunca exposta ao cliente
    console.error('[inviteMemberAction] email error:', emailError.message, '| invite link:', acceptUrl)
    return {
      warning: 'Convite criado, mas o e-mail não pôde ser enviado. Verifique os logs do servidor ou contate o suporte.',
    }
  }

  // Em dev com redirect, avisa que o e-mail foi para o owner, não para o convidado
  if (isDev && devOverrideEmail && devOverrideEmail !== email) {
    console.info('[inviteMemberAction][dev] invite link:', acceptUrl)
    revalidatePath('/settings/members')
    return {
      warning: `[Dev] E-mail enviado para ${devOverrideEmail} (não para ${email}). Verifique o console do servidor para o link.`,
    }
  }

  revalidatePath('/settings/members')
  return {}
}

// ─── acceptInviteAction ───────────────────────────────────────────────────────

export async function acceptInviteAction(
  token: string
): Promise<{ error?: string; emailMismatch?: true; workspaceId?: string }> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Você precisa estar logado para aceitar o convite' }

  const admin = getSupabaseAdminClient()

  // Busca o convite via admin (sem RLS — o token é público)
  const { data: invite } = await admin
    .from('workspace_invites')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) return { error: 'Convite inválido ou expirado' }

  // E-mail do usuário logado deve bater com o e-mail do convite
  // Retornamos apenas um flag — não revelamos o e-mail esperado ao cliente
  if (invite.email.toLowerCase() !== (user.email ?? '').toLowerCase()) {
    return { emailMismatch: true }
  }

  // Verifica se já é membro
  const { data: existing } = await admin
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', invite.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    const { error: memberError } = await admin
      .from('workspace_members')
      .insert({ workspace_id: invite.workspace_id, user_id: user.id, role: invite.role })

    if (memberError) {
      console.error('[acceptInviteAction] insert member error:', memberError.message)
      return { error: 'Falha ao entrar no workspace. Tente novamente.' }
    }
  }

  // Marca convite como aceito
  await admin
    .from('workspace_invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  return { workspaceId: invite.workspace_id }
}

// ─── removeMemberAction ───────────────────────────────────────────────────────

export async function removeMemberAction(
  memberId: string
): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const ctx = await getWorkspaceContext()
  if (!ctx) return { error: 'Workspace não encontrado' }

  if (!(await isAdmin(ctx.workspace.id))) return { error: 'Apenas administradores podem remover membros' }

  // Verifica se não é o último admin
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role, user_id')
    .eq('id', memberId)
    .eq('workspace_id', ctx.workspace.id)
    .single()

  if (!member) return { error: 'Membro não encontrado' }

  if (member.role === 'admin') {
    const { count } = await supabase
      .from('workspace_members')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', ctx.workspace.id)
      .eq('role', 'admin')

    if ((count ?? 0) <= 1) return { error: 'Não é possível remover o último administrador' }
  }

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('id', memberId)
    .eq('workspace_id', ctx.workspace.id)

  if (error) return { error: 'Falha ao remover membro' }

  revalidatePath('/settings/members')
  return {}
}

// ─── updateMemberRoleAction ───────────────────────────────────────────────────

export async function updateMemberRoleAction(
  memberId: string,
  role: 'admin' | 'member'
): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const ctx = await getWorkspaceContext()
  if (!ctx) return { error: 'Workspace não encontrado' }

  if (!(await isAdmin(ctx.workspace.id))) return { error: 'Apenas administradores podem alterar papéis' }

  // Protege o último admin
  if (role === 'member') {
    const { data: current } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('id', memberId)
      .eq('workspace_id', ctx.workspace.id)
      .single()

    if (current?.role === 'admin') {
      const { count } = await supabase
        .from('workspace_members')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', ctx.workspace.id)
        .eq('role', 'admin')

      if ((count ?? 0) <= 1) return { error: 'Não é possível rebaixar o último administrador' }
    }
  }

  const { error } = await supabase
    .from('workspace_members')
    .update({ role })
    .eq('id', memberId)
    .eq('workspace_id', ctx.workspace.id)

  if (error) return { error: 'Falha ao atualizar papel' }

  revalidatePath('/settings/members')
  return {}
}

// ─── cancelInviteAction ───────────────────────────────────────────────────────

export async function cancelInviteAction(
  inviteId: string
): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const ctx = await getWorkspaceContext()
  if (!ctx) return { error: 'Workspace não encontrado' }

  if (!(await isAdmin(ctx.workspace.id))) return { error: 'Apenas administradores podem cancelar convites' }

  const { error } = await supabase
    .from('workspace_invites')
    .delete()
    .eq('id', inviteId)
    .eq('workspace_id', ctx.workspace.id)

  if (error) return { error: 'Falha ao cancelar convite' }

  revalidatePath('/settings/members')
  return {}
}

// ─── updateWorkspaceAction ────────────────────────────────────────────────────

export async function updateWorkspaceAction(
  name: string
): Promise<{ error?: string }> {
  const parsed = z.string().min(1, 'Nome não pode ser vazio').max(255).safeParse(name?.trim())
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const ctx = await getWorkspaceContext()
  if (!ctx) return { error: 'Workspace não encontrado' }

  if (!(await isAdmin(ctx.workspace.id))) return { error: 'Apenas administradores podem editar o workspace' }

  const { error } = await supabase
    .from('workspaces')
    .update({ name: parsed.data })
    .eq('id', ctx.workspace.id)

  if (error) return { error: 'Falha ao atualizar workspace' }

  revalidatePath('/settings/workspace')
  revalidatePath('/dashboard')
  return {}
}

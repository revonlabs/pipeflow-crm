'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/permissions'
import { getWorkspaceContext } from '@/lib/workspace'
import { getResendClient } from '@/lib/resend'
import { renderWorkspaceInviteEmail } from '@/emails/workspace-invite'

const FREE_MEMBER_LIMIT = 2

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getActiveMemberCount(workspaceId: string): Promise<number> {
  const supabase = await getSupabaseServerClient()
  const { count } = await supabase
    .from('workspace_members')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
  return count ?? 0
}

// ─── inviteMemberAction ───────────────────────────────────────────────────────

export async function inviteMemberAction(
  email: string,
  role: 'admin' | 'member'
): Promise<{ error?: string; warning?: string }> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const ctx = await getWorkspaceContext()
  if (!ctx) return { error: 'Workspace não encontrado' }

  const workspaceId = ctx.workspace.id

  if (!(await isAdmin(workspaceId))) return { error: 'Apenas administradores podem convidar membros' }

  // Verifica limite do plano Free
  if (ctx.workspace.plan === 'free') {
    const count = await getActiveMemberCount(workspaceId)
    if (count >= FREE_MEMBER_LIMIT) {
      return { error: `O plano Free permite no máximo ${FREE_MEMBER_LIMIT} membros. Faça upgrade para Pro.` }
    }
  }

  // Verifica se já é membro
  const admin = getSupabaseAdminClient()
  const { data: existingUsers } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const targetUser = existingUsers.users.find((u) => u.email === email)

  if (targetUser) {
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUser.id)
      .maybeSingle()

    if (existingMember) return { error: 'Este usuário já é membro do workspace' }
  }

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const acceptUrl = `${appUrl}/invite/${invite.token}`

  const inviterName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'Alguém'

  try {
    const resend = getResendClient()
    await resend.emails.send({
      from: 'PipeFlow <noreply@resend.dev>',
      to: email,
      subject: `Você foi convidado para ${ctx.workspace.name} no PipeFlow`,
      html: renderWorkspaceInviteEmail({
        workspaceName: ctx.workspace.name,
        inviterName,
        inviterEmail: user.email ?? '',
        role,
        acceptUrl,
      }),
    })
  } catch (emailErr) {
    console.error('[inviteMemberAction] email error:', emailErr)
    // Convite criado mas e-mail falhou — retorna warning para o admin saber
    return { warning: 'Convite criado, mas o e-mail não pôde ser enviado. Compartilhe o link manualmente.' }
  }

  revalidatePath('/settings/members')
  return {}
}

// ─── acceptInviteAction ───────────────────────────────────────────────────────

export async function acceptInviteAction(
  token: string
): Promise<{ error?: string; expectedEmail?: string; workspaceId?: string }> {
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
  if (invite.email.toLowerCase() !== (user.email ?? '').toLowerCase()) {
    return { expectedEmail: invite.email }
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
  if (!name.trim()) return { error: 'Nome não pode ser vazio' }

  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const ctx = await getWorkspaceContext()
  if (!ctx) return { error: 'Workspace não encontrado' }

  if (!(await isAdmin(ctx.workspace.id))) return { error: 'Apenas administradores podem editar o workspace' }

  const { error } = await supabase
    .from('workspaces')
    .update({ name: name.trim() })
    .eq('id', ctx.workspace.id)

  if (error) return { error: 'Falha ao atualizar workspace' }

  revalidatePath('/settings/workspace')
  revalidatePath('/dashboard')
  return {}
}

'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isPlatformAdmin } from '@/lib/platform-admin'
import { slugify } from '@/lib/slug'
import { getResendClient } from '@/lib/resend'
import { renderWorkspaceInviteEmail } from '@/emails/workspace-invite'
import type { Plan, WorkspaceRole } from '@/types'

const planSchema = z.enum(['free', 'pro', 'payment_failed'])
const inviteSchema = z.object({
  email: z.string().email('E-mail inválido'),
  role: z.enum(['admin', 'member']),
})

// ─── createClientWorkspaceAction ──────────────────────────────────────────────

export async function createClientWorkspaceAction(
  name: string,
  plan: Plan
): Promise<{ error?: string; workspaceId?: string }> {
  if (!(await isPlatformAdmin())) return { error: 'Acesso restrito ao administrador da plataforma' }

  const parsedName = z.string().trim().min(1, 'Nome não pode ser vazio').max(255).safeParse(name)
  if (!parsedName.success) return { error: parsedName.error.issues[0].message }

  const parsedPlan = planSchema.safeParse(plan)
  if (!parsedPlan.success) return { error: 'Plano inválido' }

  const slug = slugify(parsedName.data)
  if (!slug) return { error: 'Nome inválido para gerar um slug.' }

  const supabase = await getSupabaseServerClient()

  let { data: workspace, error: insertError } = await supabase
    .from('workspaces')
    .insert({ name: parsedName.data, slug, plan: parsedPlan.data })
    .select('id')
    .single()

  if (insertError?.code === '23505') {
    const retrySlug = `${slug}-${Math.random().toString(36).slice(2, 8)}`
    const retry = await supabase
      .from('workspaces')
      .insert({ name: parsedName.data, slug: retrySlug, plan: parsedPlan.data })
      .select('id')
      .single()
    workspace = retry.data
    insertError = retry.error
  }

  if (insertError || !workspace) {
    console.error('[createClientWorkspaceAction] insert error:', insertError?.message)
    return { error: 'Falha ao criar workspace. Tente novamente.' }
  }

  revalidatePath('/settings/clients')
  return { workspaceId: workspace.id }
}

// ─── inviteClientUserAction ────────────────────────────────────────────────────

export async function inviteClientUserAction(
  workspaceId: string,
  email: string,
  role: WorkspaceRole
): Promise<{ error?: string; warning?: string }> {
  if (!(await isPlatformAdmin())) return { error: 'Acesso restrito ao administrador da plataforma' }

  const parsed = inviteSchema.safeParse({ email, role })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('id', workspaceId)
    .single()

  if (!workspace) return { error: 'Workspace não encontrado' }

  const { data: pendingInvite } = await supabase
    .from('workspace_invites')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('email', parsed.data.email)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (pendingInvite) return { error: 'Já existe um convite pendente para este e-mail' }

  const { data: invite, error: insertError } = await supabase
    .from('workspace_invites')
    .insert({ workspace_id: workspaceId, email: parsed.data.email, role: parsed.data.role })
    .select('token')
    .single()

  if (insertError || !invite) {
    console.error('[inviteClientUserAction] insert error:', insertError?.message)
    return { error: 'Falha ao criar convite. Tente novamente.' }
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const acceptUrl = `${appUrl}/invite/${invite.token}`

  const isDev = process.env.NODE_ENV === 'development'
  const devOverrideEmail = process.env.RESEND_DEV_TO_EMAIL
  const toEmail = isDev && devOverrideEmail ? devOverrideEmail : parsed.data.email

  const resend = getResendClient()
  const { error: emailError } = await resend.emails.send({
    from: 'Revon Studio CRM <onboarding@resend.dev>',
    to: toEmail,
    subject: `Você foi convidado para ${workspace.name} no Revon Studio CRM`,
    html: renderWorkspaceInviteEmail({
      workspaceName: workspace.name,
      inviterName: 'Revon Labs',
      inviterEmail: user.email ?? '',
      role: parsed.data.role,
      acceptUrl,
    }),
  })

  if (emailError) {
    console.error('[inviteClientUserAction] email error:', emailError.message, '| invite link:', acceptUrl)
    return {
      warning: 'Convite criado, mas o e-mail não pôde ser enviado. Verifique os logs do servidor.',
    }
  }

  if (isDev && devOverrideEmail && devOverrideEmail !== parsed.data.email) {
    console.info('[inviteClientUserAction][dev] invite link:', acceptUrl)
    revalidatePath('/settings/clients')
    return {
      warning: `[Dev] E-mail enviado para ${devOverrideEmail} (não para ${parsed.data.email}). Verifique o console do servidor para o link.`,
    }
  }

  revalidatePath('/settings/clients')
  return {}
}

// ─── updateClientPlanAction ────────────────────────────────────────────────────

export async function updateClientPlanAction(
  workspaceId: string,
  plan: Plan
): Promise<{ error?: string }> {
  if (!(await isPlatformAdmin())) return { error: 'Acesso restrito ao administrador da plataforma' }

  const parsedPlan = planSchema.safeParse(plan)
  if (!parsedPlan.success) return { error: 'Plano inválido' }

  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('workspaces')
    .update({ plan: parsedPlan.data })
    .eq('id', workspaceId)

  if (error) return { error: 'Falha ao atualizar plano' }

  revalidatePath('/settings/clients')
  return {}
}

// ─── deleteClientWorkspaceAction ───────────────────────────────────────────────

export async function deleteClientWorkspaceAction(workspaceId: string): Promise<{ error?: string }> {
  if (!(await isPlatformAdmin())) return { error: 'Acesso restrito ao administrador da plataforma' }

  const admin = getSupabaseAdminClient()
  const { error } = await admin.from('workspaces').delete().eq('id', workspaceId)

  if (error) return { error: 'Falha ao excluir workspace' }

  revalidatePath('/settings/clients')
  return {}
}

'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slug'

export async function createWorkspaceAction(name: string): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Não autenticado' }

  const slug = slugify(name)

  if (!slug) return { error: 'Nome inválido para gerar um slug.' }

  // SECURITY DEFINER em public — acessível via PostgREST, search_path='' para segurança
  const { data: workspaceId, error: rpcError } = await supabase
    .rpc('create_workspace', {
      workspace_name: name,
      workspace_slug: slug,
    })

  if (rpcError || !workspaceId) {
    console.error('[createWorkspaceAction] rpc error:', rpcError?.message)
    return { error: 'Falha ao criar workspace. Tente novamente.' }
  }

  const cookieStore = await cookies()
  cookieStore.set('pf_active_workspace', workspaceId as string, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
  redirect('/dashboard')
}

export async function switchWorkspaceAction(workspaceId: string) {
  const supabase = await getSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Verifica membership do usuário autenticado — impede IDOR
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!membership) return { error: 'Acesso negado' }

  const cookieStore = await cookies()
  cookieStore.set('pf_active_workspace', workspaceId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
  redirect('/dashboard')
}

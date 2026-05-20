'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function createWorkspaceAction(name: string): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Não autenticado' }

  const slug = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)

  if (!slug) return { error: 'Nome inválido para gerar um slug.' }

  // Chama a RPC no schema internal (não exposta via REST public)
  // .schema('internal') faz o PostgREST usar o search_path correto
  const { data: workspaceId, error: rpcError } = await supabase
    .schema('internal')
    .rpc('create_workspace', {
      workspace_name: name,
      workspace_slug: slug,
    })

  if (rpcError || !workspaceId) {
    // Fallback: slug com sufixo único para evitar conflito
    const uniqueSlug = slug ? `${slug}-${Date.now().toString(36)}` : `ws-${Date.now().toString(36)}`
    const { data: ws, error: wsError } = await supabase
      .from('workspaces')
      .insert({ name, slug: uniqueSlug, plan: 'free' })
      .select('id')
      .single()

    if (wsError || !ws) return { error: 'Falha ao criar workspace. Tente novamente.' }

    await supabase.from('workspace_members').insert({
      workspace_id: ws.id,
      user_id: user.id,
      role: 'admin',
    })

    const cookieStore = await cookies()
    cookieStore.set('pf_active_workspace', ws.id, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    redirect('/dashboard')
  }

  const cookieStore = await cookies()
  cookieStore.set('pf_active_workspace', workspaceId as string, { path: '/', maxAge: 60 * 60 * 24 * 365 })
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
  cookieStore.set('pf_active_workspace', workspaceId, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  redirect('/dashboard')
}

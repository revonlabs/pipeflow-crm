'use server'

import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getWorkspaceContext } from '@/lib/workspace'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export async function createCheckoutSessionAction() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const ctx = await getWorkspaceContext()
  if (!ctx) return { error: 'Workspace não encontrado' }

  const { workspace } = ctx

  // Busca ou cria o customer no Stripe
  let customerId = workspace.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { workspaceId: workspace.id, userId: user.id },
    })
    customerId = customer.id

    await supabase
      .from('workspaces')
      .update({ stripe_customer_id: customerId })
      .eq('id', workspace.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${appUrl}/settings/billing?success=true`,
    cancel_url: `${appUrl}/settings/billing`,
    metadata: { workspaceId: workspace.id, userId: user.id },
  })

  redirect(session.url!)
}

export async function createPortalSessionAction() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const ctx = await getWorkspaceContext()
  if (!ctx) return { error: 'Workspace não encontrado' }

  const customerId = ctx.workspace.stripe_customer_id
  if (!customerId) return { error: 'Sem assinatura ativa' }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/settings/billing`,
  })

  redirect(session.url)
}

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Route Handler — única exceção às Server Actions.
// O Stripe chama este endpoint externamente (sem sessão de usuário),
// e precisa do body raw (text) para verificar a assinatura HMAC.
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  // Idempotência: ignora eventos já processados
  const { data: alreadyProcessed } = await supabase
    .from("processed_stripe_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (alreadyProcessed) {
    return NextResponse.json({ received: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const workspaceId = session.metadata?.workspaceId;
    const subscriptionId = session.subscription as string;

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    // Verifica que o workspace existe antes de ativar o plano
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 400 });
    }

    // Busca current_period_end da subscription no Stripe
    let currentPeriodEnd: string | null = null;
    if (subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
        if (periodEnd) currentPeriodEnd = new Date(periodEnd * 1000).toISOString();
      } catch {
        // não crítico — continua sem a data
      }
    }

    await supabase
      .from("subscriptions")
      .upsert({
        workspace_id: workspaceId,
        stripe_subscription_id: subscriptionId,
        status: "active",
        current_period_end: currentPeriodEnd,
      });

    await supabase
      .from("workspaces")
      .update({ plan: "pro" })
      .eq("id", workspaceId);
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;

    const { data } = await supabase
      .from("subscriptions")
      .select("workspace_id")
      .eq("stripe_subscription_id", subscription.id)
      .single();

    if (data) {
      const rawPeriodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end
      const currentPeriodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000).toISOString() : null;

      await supabase
        .from("subscriptions")
        .update({ status: subscription.status, current_period_end: currentPeriodEnd })
        .eq("stripe_subscription_id", subscription.id);

      // Sincroniza plano caso o status mude (ex: trialing → active, active → past_due)
      const plan = subscription.status === "active" ? "pro" : "payment_failed";
      await supabase
        .from("workspaces")
        .update({ plan })
        .eq("id", data.workspace_id);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    const { data } = await supabase
      .from("subscriptions")
      .select("workspace_id")
      .eq("stripe_subscription_id", subscription.id)
      .single();

    if (data) {
      await supabase
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_subscription_id", subscription.id);

      await supabase
        .from("workspaces")
        .update({ plan: "free" })
        .eq("id", data.workspace_id);
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = invoice.parent?.subscription_details?.subscription as string;

    const { data } = await supabase
      .from("subscriptions")
      .select("workspace_id")
      .eq("stripe_subscription_id", subscriptionId)
      .single();

    if (data) {
      await supabase
        .from("subscriptions")
        .update({ status: "payment_failed" })
        .eq("stripe_subscription_id", subscriptionId);

      await supabase
        .from("workspaces")
        .update({ plan: "payment_failed" })
        .eq("id", data.workspace_id);
    }
  }

  // Registra o evento como processado (idempotência)
  await supabase
    .from("processed_stripe_events")
    .insert({ event_id: event.id, processed_at: new Date().toISOString() });

  return NextResponse.json({ received: true });
}

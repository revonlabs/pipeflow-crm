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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const workspaceId = session.metadata?.workspaceId;
    const subscriptionId = session.subscription as string;

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    await supabase
      .from("subscriptions")
      .upsert({
        workspace_id: workspaceId,
        stripe_subscription_id: subscriptionId,
        status: "active",
      });

    await supabase
      .from("workspaces")
      .update({ plan: "pro" })
      .eq("id", workspaceId);
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

  return NextResponse.json({ received: true });
}

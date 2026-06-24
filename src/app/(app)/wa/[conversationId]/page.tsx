import { notFound, redirect } from "next/navigation";
import { requireWaAdmin, WaAccessDeniedError } from "@/lib/wa/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getConversationMessagesAction } from "@/lib/actions/wa-conversations";
import { ConversationView } from "@/components/wa/conversation-view";

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = await params;

  let ctx;
  try {
    ctx = await requireWaAdmin();
  } catch (err) {
    if (err instanceof WaAccessDeniedError) {
      redirect("/dashboard");
    }
    throw err;
  }

  const supabase = await getSupabaseServerClient();
  const [contactResult, messagesResult] = await Promise.all([
    supabase
      .from("wa_conversations")
      .select("id, contact:wa_contacts(display_name, phone_number)")
      .eq("id", conversationId)
      .eq("workspace_id", ctx.workspace.id)
      .maybeSingle(),
    getConversationMessagesAction(conversationId),
  ]);

  if (!contactResult.data) {
    notFound();
  }

  if ("error" in messagesResult) {
    notFound();
  }

  const contact = contactResult.data.contact;
  const contactLabel = contact?.display_name || contact?.phone_number || "Contato";

  return (
    <ConversationView
      conversationId={conversationId}
      contactLabel={contactLabel}
      initialMessages={messagesResult.messages}
      initialHasMore={messagesResult.hasMore}
    />
  );
}

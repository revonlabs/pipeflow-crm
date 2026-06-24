"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getMessageAction } from "@/lib/actions/wa-conversations";
import type { WaMessageDecrypted } from "@/types";

// Assina INSERT em wa_messages filtrado por conversation_id. O payload do
// Realtime nunca é usado diretamente — content_text/media_url estão cifrados
// no Postgres (pgcrypto), então só o id é confiável; o conteúdo decifrado
// vem de getMessageAction (wa_get_message_rpc, server-side).
// RLS de wa_messages (is_workspace_admin) já filtra o que cada client recebe.
export function useWaRealtimeMessages(
  conversationId: string,
  onMessage: (message: WaMessageDecrypted) => void
) {
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`wa-messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wa_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const messageId = (payload.new as { id?: string }).id;
          if (!messageId) return;

          getMessageAction(messageId).then((result) => {
            if ("message" in result) onMessageRef.current(result.message);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);
}

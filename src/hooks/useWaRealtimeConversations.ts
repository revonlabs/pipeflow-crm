"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface WaConversationRealtimePayload {
  id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
}

// Assina INSERT/UPDATE em wa_conversations filtrado por workspace_id.
// last_message_preview NÃO é cifrado (ver migration 030), então o payload do
// Realtime já vem pronto para a UI — sem RPC de decrypt adicional aqui.
// RLS (is_workspace_admin) garante que só admins do próprio workspace recebem
// o evento; o filtro abaixo é defesa em profundidade no client.
export function useWaRealtimeConversations(
  workspaceId: string,
  onChange: (conversation: WaConversationRealtimePayload) => void
) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`wa-conversations:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wa_conversations",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const row = payload.new as WaConversationRealtimePayload | undefined;
          if (row?.id) onChangeRef.current(row);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);
}

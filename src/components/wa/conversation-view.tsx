"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "@/components/wa/message-bubble";
import { getConversationMessagesAction } from "@/lib/actions/wa-conversations";
import { useWaRealtimeMessages } from "@/hooks/useWaRealtimeMessages";
import type { WaMessageDecrypted } from "@/types";

interface ConversationViewProps {
  conversationId: string;
  contactLabel: string;
  initialMessages: WaMessageDecrypted[];
  initialHasMore: boolean;
}

export function ConversationView({
  conversationId,
  contactLabel,
  initialMessages,
  initialHasMore,
}: ConversationViewProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [search, setSearch] = useState("");
  const [isLoadingMore, startLoadMore] = useTransition();

  const topSentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll infinito "para trás" (mensagens mais antigas) — dispara ao topo
  // da lista ficar visível, igual ao padrão de apps de WhatsApp.
  useEffect(() => {
    if (!hasMore) return;
    const sentinel = topSentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore) {
          const oldestTimestamp = messages[0]?.timestampWa;
          if (!oldestTimestamp) return;

          const previousScrollHeight = container.scrollHeight;
          startLoadMore(async () => {
            const result = await getConversationMessagesAction(conversationId, oldestTimestamp);
            if ("messages" in result) {
              setMessages((prev) => [...result.messages, ...prev]);
              setHasMore(result.hasMore);
              // Mantém a posição de leitura: compensa a altura adicionada no topo.
              requestAnimationFrame(() => {
                container.scrollTop += container.scrollHeight - previousScrollHeight;
              });
            }
          });
        }
      },
      { root: container, threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoadingMore, messages, conversationId]);

  // Scroll inicial para o final (mensagens mais recentes).
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, []);

  // Sprint 3 — mensagem nova chega via Realtime (postgres_changes), decifrada
  // pontualmente por getMessageAction. Dedupe por id evita duplicar caso o
  // evento chegue mais de uma vez (reconexão do canal).
  useWaRealtimeMessages(conversationId, (message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });

    const container = scrollContainerRef.current;
    if (container) {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      if (isNearBottom) {
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
        });
      }
    }
  });

  const filteredMessages = search
    ? messages.filter((m) => m.contentText?.toLowerCase().includes(search.toLowerCase()))
    : messages;

  return (
    <div className="flex h-[calc(100vh-160px)] flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/wa" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <p className="font-medium text-sm flex-1 truncate">{contactLabel}</p>
        <div className="relative w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar nesta conversa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {hasMore && !search && (
          <div ref={topSentinelRef} className="flex justify-center py-2">
            {isLoadingMore && <Skeleton className="h-8 w-32 rounded-md" />}
          </div>
        )}

        {filteredMessages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            {search ? "Nenhuma mensagem encontrada." : "Sem mensagens nesta conversa."}
          </p>
        ) : (
          filteredMessages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
      </div>
    </div>
  );
}

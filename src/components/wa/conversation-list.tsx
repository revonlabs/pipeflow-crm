"use client";

import { useEffect, useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { ConversationFilters } from "@/components/wa/conversation-filters";
import { ConversationCard } from "@/components/wa/conversation-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getConversationsAction } from "@/lib/actions/wa-conversations";
import type { WaConversationListItem, WaConversationStatus } from "@/types";

interface InstanceOption {
  id: string;
  displayName: string;
}

interface ConversationListProps {
  initialConversations: WaConversationListItem[];
  instances: InstanceOption[];
}

const SEARCH_DEBOUNCE_MS = 300;

export function ConversationList({ initialConversations, instances }: ConversationListProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<WaConversationStatus | "all">("all");
  const [instanceId, setInstanceId] = useState<string | "all">("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      startTransition(async () => {
        const result = await getConversationsAction({
          search: search || undefined,
          status: status === "all" ? undefined : status,
          instanceId: instanceId === "all" ? undefined : instanceId,
          page: 1,
        });
        if ("conversations" in result) {
          setConversations(result.conversations);
          setHasMore(result.conversations.length === 20);
        }
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [search, status, instanceId]);

  function loadMore() {
    const nextPage = page + 1;
    startTransition(async () => {
      const result = await getConversationsAction({
        search: search || undefined,
        status: status === "all" ? undefined : status,
        instanceId: instanceId === "all" ? undefined : instanceId,
        page: nextPage,
      });
      if ("conversations" in result) {
        setConversations((prev) => [...prev, ...result.conversations]);
        setHasMore(result.conversations.length === 20);
        setPage(nextPage);
      }
    });
  }

  return (
    <div className="space-y-4">
      <ConversationFilters
        search={search}
        status={status}
        instanceId={instanceId}
        instances={instances}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onInstanceChange={setInstanceId}
      />

      {conversations.length === 0 && !isPending ? (
        <EmptyState
          icon={MessageCircle}
          title="Nenhuma conversa encontrada"
          description="Tente ajustar os filtros de busca, status ou instância."
        />
      ) : (
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <ConversationCard key={conversation.id} conversation={conversation} />
          ))}
          {isPending && (
            <>
              <Skeleton className="h-[68px] w-full rounded-lg" />
              <Skeleton className="h-[68px] w-full rounded-lg" />
            </>
          )}
        </div>
      )}

      {hasMore && !isPending && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={loadMore}>
            Carregar mais
          </Button>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { WaConversationListItem } from "@/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function ConversationCard({ conversation }: { conversation: WaConversationListItem }) {
  const label = conversation.contactName || conversation.contactPhone;

  return (
    <Link
      href={`/wa/${conversation.id}`}
      className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:bg-muted/40 transition-colors"
    >
      <Avatar className="h-9 w-9 shrink-0 mt-0.5">
        <AvatarFallback className="text-xs bg-muted text-muted-foreground">
          {getInitials(label)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm truncate">{label}</p>
          {conversation.lastMessageAt && (
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground truncate">
            {conversation.lastMessagePreview ?? "Sem mensagens"}
          </p>
          {conversation.unreadCount > 0 && (
            <Badge className="shrink-0 bg-crm-accent text-white">
              {conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

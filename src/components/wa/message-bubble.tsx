import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MessageMedia } from "@/components/wa/message-media";
import type { WaMessageDecrypted } from "@/types";

const SENT_BY_LABEL: Record<WaMessageDecrypted["sentBy"], string> = {
  contact: "",
  vendor: "Atendente",
  admin_intervention: "Intervenção do admin",
  automation: "Automação",
};

export function MessageBubble({ message }: { message: WaMessageDecrypted }) {
  const isOutbound = message.direction === "out";
  const senderLabel = isOutbound ? SENT_BY_LABEL[message.sentBy] : "";

  return (
    <div className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-lg px-3 py-2 text-sm",
          isOutbound
            ? "bg-crm-accent/15 border border-crm-accent/20"
            : "bg-muted/50 border border-border"
        )}
      >
        {senderLabel && (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            {senderLabel}
          </p>
        )}

        {message.mediaPath && (
          <div className="mb-1.5">
            <MessageMedia
              mediaPath={message.mediaPath}
              mediaMime={message.mediaMime}
              contentType={message.contentType}
            />
          </div>
        )}

        {message.contentText && <p className="whitespace-pre-wrap break-words">{message.contentText}</p>}

        <p className="mt-1 text-right text-[10px] text-muted-foreground">
          {format(new Date(message.timestampWa), "HH:mm", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}

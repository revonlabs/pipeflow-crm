"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getVendorActivityAction, sendAdminMessageAction } from "@/lib/actions/wa-messages";
import { isVendorLikelyActive } from "@/lib/wa/vendor-activity";
import type { WaMessageDecrypted } from "@/types";

interface AdminInterventionModalProps {
  conversationId: string;
  onSent: (message: WaMessageDecrypted) => void;
}

export function AdminInterventionModal({
  conversationId,
  onSent,
}: AdminInterventionModalProps) {
  const [open, setOpen] = useState(false);
  // Remonta o conteúdo do modal a cada abertura (key abaixo), descartando o
  // estado da vez anterior em vez de resetá-lo manualmente num efeito.
  const [openCount, setOpenCount] = useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setOpenCount((c) => c + 1);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Intervir
        </Button>
      </DialogTrigger>
      <InterventionModalContent
        key={openCount}
        conversationId={conversationId}
        onSent={(message) => {
          onSent(message);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </Dialog>
  );
}

interface InterventionModalContentProps {
  conversationId: string;
  onSent: (message: WaMessageDecrypted) => void;
  onCancel: () => void;
}

function InterventionModalContent({
  conversationId,
  onSent,
  onCancel,
}: InterventionModalContentProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [vendorActive, setVendorActive] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isSending, startSend] = useTransition();

  useEffect(() => {
    getVendorActivityAction(conversationId).then((result) => {
      if ("minutesSinceLastActivity" in result) {
        setVendorActive(isVendorLikelyActive(result.minutesSinceLastActivity));
      }
    });
  }, [conversationId]);

  const needsConfirmation = vendorActive && !confirmed;

  function handleSend() {
    if (needsConfirmation) {
      setConfirmed(true);
      return;
    }

    setError(null);
    startSend(async () => {
      const result = await sendAdminMessageAction(conversationId, text);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onSent(result.message);
    });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Intervenção do admin</DialogTitle>
        <DialogDescription>
          Esta mensagem será enviada diretamente ao contato pelo WhatsApp e
          marcada no histórico como intervenção do admin.
        </DialogDescription>
      </DialogHeader>

      {vendorActive && (
        <div className="flex items-start gap-2 rounded-md border border-crm-warm/30 bg-crm-warm/10 px-3 py-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-crm-warm" />
          <p>
            O vendedor pode estar respondendo agora. Confirme se ainda quer
            enviar esta mensagem.
          </p>
        </div>
      )}

      <Textarea
        placeholder="Digite a mensagem..."
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setConfirmed(false);
        }}
        rows={4}
      />

      {error && <p className="text-sm text-crm-negative">{error}</p>}

      <DialogFooter>
        <Button variant="ghost" onClick={onCancel} disabled={isSending}>
          Cancelar
        </Button>
        <Button onClick={handleSend} disabled={!text.trim() || isSending}>
          {isSending
            ? "Enviando..."
            : needsConfirmation
              ? "Confirmar envio"
              : "Enviar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

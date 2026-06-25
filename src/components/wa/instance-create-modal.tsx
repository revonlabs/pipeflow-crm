"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createInstanceAction, getInstanceQrAction } from "@/lib/actions/wa-instances";

// Regra de polling do QR (decisão de produto, Sprint 5.5): 3s de intervalo,
// máximo de 60s — o QR do WhatsApp expira nessa janela de qualquer forma.
// Ao esgotar, para o polling e mostra "Gerar novo QR" em vez de continuar
// tentando às ciegas. Conexão real é detectada pelo webhook connection.update
// (Realtime em wa_instances), não pelo polling — polling aqui é só para
// manter o QR válido na tela.
const POLL_INTERVAL_MS = 3000;
const POLL_WINDOW_MS = 60_000;

interface InstanceCreateModalProps {
  onCreated: () => void;
}

export function InstanceCreateModal({ onCreated }: InstanceCreateModalProps) {
  const [open, setOpen] = useState(false);
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
        <Button size="sm">Nova instância</Button>
      </DialogTrigger>
      <CreateModalContent
        key={openCount}
        onDone={() => {
          onCreated();
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </Dialog>
  );
}

type Stage = "form" | "qr" | "expired";

function CreateModalContent({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const [stage, setStage] = useState<Stage>("form");
  const [displayName, setDisplayName] = useState("");
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  function startPollWindow() {
    const deadline = Date.now() + POLL_WINDOW_MS;

    function tick() {
      if (Date.now() >= deadline) {
        setStage("expired");
        return;
      }
      pollTimeoutRef.current = setTimeout(tick, POLL_INTERVAL_MS);
    }

    pollTimeoutRef.current = setTimeout(tick, POLL_INTERVAL_MS);
  }

  function handleCreate() {
    const trimmed = displayName.trim();
    if (!trimmed) return;

    setError(null);
    startTransition(async () => {
      const result = await createInstanceAction(trimmed);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setInstanceId(result.instanceId);
      setQrBase64(result.qrCode.base64);
      setStage("qr");
      startPollWindow();
    });
  }

  function handleRegenerateQr() {
    if (!instanceId) return;
    setError(null);
    startTransition(async () => {
      const result = await getInstanceQrAction(instanceId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setQrBase64(result.qrCode.base64);
      setStage("qr");
      startPollWindow();
    });
  }

  if (stage === "form") {
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova instância de WhatsApp</DialogTitle>
          <DialogDescription>
            Dê um nome para identificar este número (ex: &quot;Vendas Loja 2&quot;).
            Depois você escaneia o QR code com o WhatsApp do celular.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Nome da instância"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoFocus
        />

        {error && <p className="text-sm text-crm-negative">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!displayName.trim() || isPending}>
            {isPending ? "Criando..." : "Gerar QR code"}
          </Button>
        </DialogFooter>
      </DialogContent>
    );
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Escaneie o QR code</DialogTitle>
        <DialogDescription>
          No WhatsApp do celular: Configurações → Dispositivos conectados →
          Conectar dispositivo. Esta tela fecha automaticamente quando a
          conexão for confirmada.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center gap-3">
        {stage === "qr" && qrBase64 && (
          // eslint-disable-next-line @next/next/no-img-element -- base64 inline, next/image não otimiza data: URIs
          <img
            src={qrBase64}
            alt="QR code do WhatsApp"
            width={280}
            height={280}
            className="rounded-md border"
            style={{ borderColor: "#1E1E22" }}
          />
        )}

        {stage === "expired" && (
          <div className="flex h-[280px] w-[280px] flex-col items-center justify-center gap-3 rounded-md border text-center" style={{ borderColor: "#1E1E22" }}>
            <p className="text-sm text-muted-foreground">
              O QR code expirou.
            </p>
            <Button size="sm" onClick={handleRegenerateQr} disabled={isPending}>
              {isPending ? "Gerando..." : "Gerar novo QR"}
            </Button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-crm-negative">{error}</p>}

      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          Fechar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

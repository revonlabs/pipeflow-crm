"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { InstanceCreateModal } from "@/components/wa/instance-create-modal";
import { getInstancesAction, deleteInstanceAction } from "@/lib/actions/wa-instances";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { WaInstance, WaInstanceStatus } from "@/types";

const STATUS_LABEL: Record<WaInstanceStatus, string> = {
  connected: "Conectado",
  disconnected: "Desconectado",
  qr_pending: "Aguardando QR",
  banned: "Banido",
};

const STATUS_VARIANT: Record<WaInstanceStatus, "default" | "secondary" | "destructive" | "outline"> = {
  connected: "default",
  disconnected: "secondary",
  qr_pending: "outline",
  banned: "destructive",
};

interface InstanceListProps {
  workspaceId: string;
  initialInstances: WaInstance[];
}

export function InstanceList({ workspaceId, initialInstances }: InstanceListProps) {
  const [instances, setInstances] = useState(initialInstances);
  const [, startRefresh] = useTransition();

  function refresh() {
    startRefresh(async () => {
      const result = await getInstancesAction();
      if ("instances" in result) {
        setInstances(result.instances);
      }
    });
  }

  // Realtime: quando o webhook connection.update atualiza wa_instances.status
  // (via worker), reflete na lista sem precisar polling — mesmo padrão de
  // Realtime já usado nas conversas (Sprint 3).
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`wa_instances_${workspaceId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "wa_instances", filter: `workspace_id=eq.${workspaceId}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <InstanceCreateModal onCreated={refresh} />
      </div>

      {instances.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma instância configurada ainda. Clique em &quot;Nova
            instância&quot; para conectar um número de WhatsApp.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {instances.map((instance) => (
            <InstanceRow key={instance.id} instance={instance} onDeleted={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

function InstanceRow({
  instance,
  onDeleted,
}: {
  instance: WaInstance;
  onDeleted: () => void;
}) {
  const [isDeleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startDelete(async () => {
      const result = await deleteInstanceAction(instance.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onDeleted();
    });
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{instance.display_name}</p>
            <Badge variant={STATUS_VARIANT[instance.status]}>
              {STATUS_LABEL[instance.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {instance.phone_number ?? "Número ainda não confirmado"}
          </p>
          {error && <p className="text-sm text-crm-negative">{error}</p>}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isDeleting}>
              {isDeleting ? "Removendo..." : "Remover"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover instância?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação desconecta <strong>{instance.display_name}</strong>{" "}
                do WhatsApp e remove o registro do CRM. As conversas e
                mensagens já recebidas não são apagadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Sim, remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createLostReasonAction, deleteLostReasonAction } from "@/lib/actions/lost-reasons";
import type { LostReason } from "@/types";

interface LostReasonsListProps {
  reasons: LostReason[];
  isAdmin: boolean;
}

export function LostReasonsList({ reasons, isAdmin }: LostReasonsListProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createLostReasonAction(name.trim());
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setName("");
    });
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex gap-2">
          <Input
            placeholder="Ex: Preço alto, Concorrente, Sem orçamento..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
            }}
            disabled={isPending}
          />
          <Button onClick={handleCreate} disabled={isPending || !name.trim()} className="gap-1.5 shrink-0">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {reasons.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum motivo de perda cadastrado ainda.
          {!isAdmin && " Peça a um administrador para cadastrar."}
        </p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {reasons.map((reason) => (
            <ReasonRow key={reason.id} reason={reason} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReasonRow({ reason, isAdmin }: { reason: LostReason; isAdmin: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteLostReasonAction(reason.id);
    });
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800">
        <Tag className="h-4 w-4 text-zinc-400" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{reason.name}</p>
      </div>

      {isAdmin && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir motivo de perda?</AlertDialogTitle>
              <AlertDialogDescription>
                O motivo <strong>{reason.name}</strong> será removido. Negócios que já usavam este
                motivo manterão o histórico, mas ele deixará de aparecer na lista de seleção.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

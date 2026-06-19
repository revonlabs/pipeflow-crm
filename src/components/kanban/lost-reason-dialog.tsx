"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { LostReason } from "@/types";

interface LostReasonDialogProps {
  open: boolean;
  dealTitle: string;
  reasons: LostReason[];
  onConfirm: (reasonId: string) => void;
  onCancel: () => void;
}

export function LostReasonDialog({
  open,
  dealTitle,
  reasons,
  onConfirm,
  onCancel,
}: LostReasonDialogProps) {
  const [reasonId, setReasonId] = useState<string>("");

  function handleOpenChange(next: boolean) {
    if (!next) {
      setReasonId("");
      onCancel();
    }
  }

  function handleConfirm() {
    if (!reasonId) return;
    onConfirm(reasonId);
    setReasonId("");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[420px]"
        style={{ backgroundColor: "#0D1B2E", border: "1px solid #2A2A2E" }}
      >
        <DialogHeader>
          <DialogTitle className="text-[#F0F8FF]">Motivo da perda</DialogTitle>
        </DialogHeader>

        <p className="text-[13px] text-[#8BACD4]">
          Por que <span className="text-[#F0F8FF] font-medium">{dealTitle}</span> foi
          perdido? Selecione um motivo para confirmar.
        </p>

        {reasons.length === 0 ? (
          <p className="text-[12px] text-[#8BACD4] rounded-md border border-[#2A2A2E] bg-[#0D1B2E] p-3">
            Nenhum motivo de perda cadastrado ainda. Peça a um administrador para
            cadastrar em Configurações → Motivos de Perda.
          </p>
        ) : (
          <Select value={reasonId} onValueChange={setReasonId}>
            <SelectTrigger className="border-[#2A2A2E] bg-[#0D1B2E] text-[#F0F8FF] focus:ring-[#FF7043]/30">
              <SelectValue placeholder="Selecionar motivo" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: "#0D1B2E", borderColor: "#2A2A2E" }}>
              {reasons.map((reason) => (
                <SelectItem
                  key={reason.id}
                  value={reason.id}
                  className="text-[#F0F8FF] focus:bg-[#0D1B2E] focus:text-[#FF7043]"
                >
                  {reason.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="ghost"
            className="text-[#8BACD4] hover:text-[#F0F8FF] hover:bg-[#0D1B2E]"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!reasonId}
            onClick={handleConfirm}
            className="font-semibold border-0 disabled:opacity-40"
            style={{ backgroundColor: "#FF4444", color: "#060B14" }}
          >
            Marcar como perdido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

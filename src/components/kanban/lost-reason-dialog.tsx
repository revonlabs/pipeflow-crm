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
        style={{ backgroundColor: "#141416", border: "1px solid #2A2A2E" }}
      >
        <DialogHeader>
          <DialogTitle className="text-[#E8E8E8]">Motivo da perda</DialogTitle>
        </DialogHeader>

        <p className="text-[13px] text-[#8A8A8F]">
          Por que <span className="text-[#E8E8E8] font-medium">{dealTitle}</span> foi
          perdido? Selecione um motivo para confirmar.
        </p>

        {reasons.length === 0 ? (
          <p className="text-[12px] text-[#8A8A8F] rounded-md border border-[#2A2A2E] bg-[#1A1A1E] p-3">
            Nenhum motivo de perda cadastrado ainda. Peça a um administrador para
            cadastrar em Configurações → Motivos de Perda.
          </p>
        ) : (
          <Select value={reasonId} onValueChange={setReasonId}>
            <SelectTrigger className="border-[#2A2A2E] bg-[#1A1A1E] text-[#E8E8E8] focus:ring-[#CAFF33]/30">
              <SelectValue placeholder="Selecionar motivo" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: "#141416", borderColor: "#2A2A2E" }}>
              {reasons.map((reason) => (
                <SelectItem
                  key={reason.id}
                  value={reason.id}
                  className="text-[#E8E8E8] focus:bg-[#1A1A1E] focus:text-[#CAFF33]"
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
            className="text-[#8A8A8F] hover:text-[#E8E8E8] hover:bg-[#1A1A1E]"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!reasonId}
            onClick={handleConfirm}
            className="font-semibold border-0 disabled:opacity-40"
            style={{ backgroundColor: "#FF4757", color: "#0C0C0E" }}
          >
            Marcar como perdido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

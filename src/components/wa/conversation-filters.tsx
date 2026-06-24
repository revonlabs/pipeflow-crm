"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { WaConversationStatus } from "@/types";

interface InstanceOption {
  id: string;
  displayName: string;
}

interface ConversationFiltersProps {
  search: string;
  status: WaConversationStatus | "all";
  instanceId: string | "all";
  instances: InstanceOption[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: WaConversationStatus | "all") => void;
  onInstanceChange: (value: string | "all") => void;
}

export function ConversationFilters({
  search,
  status,
  instanceId,
  instances,
  onSearchChange,
  onStatusChange,
  onInstanceChange,
}: ConversationFiltersProps) {
  const hasFilters = search !== "" || status !== "all" || instanceId !== "all";

  function clearFilters() {
    onSearchChange("");
    onStatusChange("all");
    onInstanceChange("all");
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={status}
        onValueChange={(v) => onStatusChange(v as WaConversationStatus | "all")}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="active">Ativas</SelectItem>
          <SelectItem value="archived">Arquivadas</SelectItem>
        </SelectContent>
      </Select>

      {instances.length > 0 && (
        <Select value={instanceId} onValueChange={onInstanceChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Instância" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as instâncias</SelectItem>
            {instances.map((instance) => (
              <SelectItem key={instance.id} value={instance.id}>
                {instance.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
          <X className="h-3.5 w-3.5" />
          Limpar
        </Button>
      )}
    </div>
  );
}

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
import type { LeadStatus } from "@/types";
import type { MemberInfo } from "@/lib/members";

interface LeadsFiltersProps {
  search: string;
  status: LeadStatus | "all";
  ownerId: string | "all";
  members: MemberInfo[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: LeadStatus | "all") => void;
  onOwnerChange: (value: string | "all") => void;
}

export function LeadsFilters({
  search,
  status,
  ownerId,
  members,
  onSearchChange,
  onStatusChange,
  onOwnerChange,
}: LeadsFiltersProps) {
  const hasFilters = search !== "" || status !== "all" || ownerId !== "all";

  function clearFilters() {
    onSearchChange("");
    onStatusChange("all");
    onOwnerChange("all");
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou empresa..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={status} onValueChange={(v) => onStatusChange(v as LeadStatus | "all")}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="active">Ativo</SelectItem>
          <SelectItem value="inactive">Inativo</SelectItem>
          <SelectItem value="converted">Convertido</SelectItem>
          <SelectItem value="lost">Perdido</SelectItem>
        </SelectContent>
      </Select>

      <Select value={ownerId} onValueChange={onOwnerChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
          <X className="h-3.5 w-3.5" />
          Limpar
        </Button>
      )}
    </div>
  );
}

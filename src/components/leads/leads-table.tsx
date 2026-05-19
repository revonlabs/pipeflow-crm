"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal, Pencil, Trash2, ExternalLink, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { LeadsFilters } from "@/components/leads/leads-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { MOCK_MEMBERS } from "@/lib/mock/leads";
import type { Lead, LeadStatus } from "@/types";

interface LeadsTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}

interface DeleteConfirmState {
  open: boolean;
  lead: Lead | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getOwnerName(ownerId: string | null) {
  if (!ownerId) return "—";
  return MOCK_MEMBERS.find((m) => m.id === ownerId)?.name ?? "—";
}

const PAGE_SIZE = 8;

export function LeadsTable({ leads, onEdit, onDelete }: LeadsTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [ownerId, setOwnerId] = useState<string | "all">("all");
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ open: false, lead: null });

  const filtered = leads.filter((lead) => {
    const matchesSearch =
      search === "" ||
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      (lead.company ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "all" || lead.status === status;
    const matchesOwner = ownerId === "all" || lead.owner_id === ownerId;
    return matchesSearch && matchesStatus && matchesOwner;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }
  function handleStatusChange(value: LeadStatus | "all") {
    setStatus(value);
    setPage(1);
  }
  function handleOwnerChange(value: string | "all") {
    setOwnerId(value);
    setPage(1);
  }

  return (
    <>
    <AlertDialog
      open={deleteConfirm.open}
      onOpenChange={(open) => setDeleteConfirm((s) => ({ ...s, open }))}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. O lead{" "}
            <strong>{deleteConfirm.lead?.name}</strong> será removido
            permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (deleteConfirm.lead) onDelete(deleteConfirm.lead);
              setDeleteConfirm({ open: false, lead: null });
            }}
            className="bg-destructive hover:bg-destructive/90"
          >
            Sim, excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <div className="space-y-4">
      <LeadsFilters
        search={search}
        status={status}
        ownerId={ownerId}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onOwnerChange={handleOwnerChange}
      />

      {paginated.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum lead encontrado"
          description="Tente ajustar os filtros ou adicione um novo lead."
        />
      ) : (
        <>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Empresa</TableHead>
                  <TableHead className="hidden md:table-cell">Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                  <TableHead className="hidden lg:table-cell">Criado em</TableHead>
                  <TableHead className="w-[48px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((lead) => (
                  <TableRow key={lead.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                            {getInitials(lead.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="font-medium text-sm hover:text-primary transition-colors truncate block"
                          >
                            {lead.name}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate sm:hidden">
                            {lead.company ?? "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {lead.company ?? "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {lead.role ?? "—"}
                    </TableCell>
                    <TableCell>
                      <LeadStatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {getOwnerName(lead.owner_id)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {format(new Date(lead.created_at), "dd MMM yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ações</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/leads/${lead.id}`} className="flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Ver detalhes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEdit(lead)}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm({ open: true, lead })}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="px-2">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
}

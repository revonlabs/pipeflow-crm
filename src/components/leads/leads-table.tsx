"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal, Pencil, Trash2, ExternalLink, Users, Plus } from "lucide-react";
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
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { createLeadAction, updateLeadAction, deleteLeadAction } from "@/lib/actions/leads";
import type { Lead, LeadStatus, LeadSource } from "@/types";
import type { MemberInfo } from "@/lib/members";

interface LeadsTableProps {
  leads: Lead[];
  members: MemberInfo[];
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

const PAGE_SIZE = 8;

const SOURCE_LABELS: Record<LeadSource, string> = {
  manual: "Manual",
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  organic: "Orgânico",
  proposal: "Proposta",
};

export function LeadsTable({ leads: initialLeads, members }: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  useEffect(() => { setLeads(initialLeads); }, [initialLeads]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [ownerId, setOwnerId] = useState<string | "all">("all");
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ open: false, lead: null });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isPending, startTransition] = useTransition();

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

  function handleSearchChange(value: string) { setSearch(value); setPage(1); }
  function handleStatusChange(value: LeadStatus | "all") { setStatus(value); setPage(1); }
  function handleOwnerChange(value: string | "all") { setOwnerId(value); setPage(1); }

  function handleOpenCreate() { setEditingLead(null); setDialogOpen(true); }
  function handleOpenEdit(lead: Lead) { setEditingLead(lead); setDialogOpen(true); }

  function handleSubmit(
    values: { name: string; email: string; phone?: string; company?: string; role?: string; status: Lead["status"]; source?: LeadSource | null; owner_id?: string },
    id?: string
  ) {
    if (id) {
      // Optimistic update
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, ...values, phone: values.phone ?? null, company: values.company ?? null, role: values.role ?? null, source: values.source ?? null, owner_id: values.owner_id ?? null }
            : l
        )
      );
      startTransition(async () => {
        const result = await updateLeadAction(id, values);
        if (result.error) {
          // Revert on error — reload from server via revalidatePath already triggers
          setLeads(initialLeads);
        }
      });
    } else {
      // Optimistic insert antes da action — revalidatePath vai substituir com dados reais
      const optimisticId = `optimistic-${Date.now()}`;
      const optimistic: Lead = {
        id: optimisticId,
        workspace_id: "",
        created_at: new Date().toISOString(),
        name: values.name,
        email: values.email,
        phone: values.phone ?? null,
        company: values.company ?? null,
        role: values.role ?? null,
        status: values.status,
        source: values.source ?? null,
        owner_id: values.owner_id ?? null,
      };
      setLeads((prev) => [optimistic, ...prev]);

      startTransition(async () => {
        const result = await createLeadAction(values);
        if (result.error) {
          // Reverte o optimistic em caso de erro
          setLeads((prev) => prev.filter((l) => l.id !== optimisticId));
        }
        // Em caso de sucesso, revalidatePath atualiza o Server Component
        // e o useState é reinicializado com os dados reais do servidor
      });
    }
  }

  function handleDelete(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    startTransition(async () => {
      await deleteLeadAction(id);
    });
  }

  function getMemberName(ownerId: string | null) {
    if (!ownerId) return "—";
    return members.find((m) => m.id === ownerId)?.name ?? "—";
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
              <strong>{deleteConfirm.lead?.name}</strong> será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm.lead) handleDelete(deleteConfirm.lead.id);
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <LeadsFilters
            search={search}
            status={status}
            ownerId={ownerId}
            members={members}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            onOwnerChange={handleOwnerChange}
          />
          <Button onClick={handleOpenCreate} className="gap-2 shrink-0 w-full sm:w-auto" disabled={isPending}>
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        </div>

        {paginated.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum lead encontrado"
            description="Tente ajustar os filtros ou adicione um novo lead."
          />
        ) : (
          <>
            {/* Card view — mobile only */}
            <div className="sm:hidden space-y-2">
              {paginated.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-lg border border-border bg-card p-3 flex items-start gap-3"
                >
                  <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                    <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                      {getInitials(lead.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-medium text-sm hover:text-primary transition-colors truncate block"
                      >
                        {lead.name}
                      </Link>
                      <LeadStatusBadge status={lead.status} />
                    </div>
                    {lead.company && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.company}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => handleOpenEdit(lead)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ open: true, lead })}
                        className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table view — sm+ */}
            <div className="hidden sm:block rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden sm:table-cell">Empresa</TableHead>
                    <TableHead className="hidden md:table-cell">Cargo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Origem</TableHead>
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
                        {lead.source ? SOURCE_LABELS[lead.source] : "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {getMemberName(lead.owner_id)}
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
                            <DropdownMenuItem onClick={() => handleOpenEdit(lead)} className="gap-2">
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
                <span>{filtered.length} lead{filtered.length !== 1 ? "s" : ""}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="px-2">{currentPage} / {totalPages}</span>
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

      <LeadFormDialog
        open={dialogOpen}
        lead={editingLead}
        members={members}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { MOCK_LEADS } from "@/lib/mock/leads";
import type { Lead } from "@/types";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  function handleOpenCreate() {
    setEditingLead(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(lead: Lead) {
    setEditingLead(lead);
    setDialogOpen(true);
  }

  function handleSubmit(
    values: { name: string; email: string; phone?: string; company?: string; role?: string; status: Lead["status"]; owner_id?: string; notes?: string },
    id?: string
  ) {
    if (id) {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                name: values.name,
                email: values.email,
                phone: values.phone ?? null,
                company: values.company ?? null,
                role: values.role ?? null,
                status: values.status,
                owner_id: values.owner_id ?? null,
              }
            : l
        )
      );
    } else {
      const newLead: Lead = {
        id: `lead-${Date.now()}`,
        workspace_id: "ws-1",
        created_at: new Date().toISOString(),
        name: values.name,
        email: values.email,
        phone: values.phone ?? null,
        company: values.company ?? null,
        role: values.role ?? null,
        status: values.status,
        owner_id: values.owner_id ?? null,
      };
      setLeads((prev) => [newLead, ...prev]);
    }
  }

  function handleDelete(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description={`${leads.length} contato${leads.length !== 1 ? "s" : ""} no workspace`}
        action={
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        }
      />

      <LeadsTable
        leads={leads}
        onEdit={handleOpenEdit}
        onDelete={(lead) => handleDelete(lead.id)}
      />

      <LeadFormDialog
        open={dialogOpen}
        lead={editingLead}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { ActivityFormDialog } from "@/components/leads/activity-form-dialog";
import { updateLeadAction, deleteLeadAction } from "@/lib/actions/leads";
import type { Lead, Tag } from "@/types";
import type { MemberInfo } from "@/lib/members";

interface LeadDetailClientProps {
  lead: Lead;
  members: MemberInfo[];
  workspaceTags: Tag[];
}

export function LeadDetailClient({ lead, members, workspaceTags }: LeadDetailClientProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [, startTransition] = useTransition();

  function handleSubmit(
    values: { name: string; email: string; phone?: string; company?: string; role?: string; status: Lead["status"]; owner_id?: string },
    id?: string
  ) {
    if (!id) return;
    startTransition(async () => {
      await updateLeadAction(id, values);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteLeadAction(id);
      router.push("/leads");
    });
  }

  return (
    <>
      <Button onClick={() => setEditOpen(true)} variant="outline" size="sm" className="gap-2">
        <Pencil className="h-3.5 w-3.5" />
        Editar Lead
      </Button>

      <LeadFormDialog
        open={editOpen}
        lead={lead}
        members={members}
        workspaceTags={workspaceTags}
        onOpenChange={setEditOpen}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </>
  );
}

export function ActivityButton({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-xs"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" />
        Registrar
      </Button>

      <ActivityFormDialog
        open={open}
        leadId={leadId}
        onOpenChange={setOpen}
      />
    </>
  );
}

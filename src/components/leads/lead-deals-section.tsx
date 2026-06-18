"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DealFormDialog } from "@/components/kanban/deal-form-dialog";
import { STAGE_CONFIG } from "@/components/kanban/kanban-board";
import { createDealAction, updateDealAction, deleteDealAction } from "@/lib/actions/deals";
import { formatCurrencyValue } from "@/components/ui/currency-input";
import type { Deal } from "@/types";
import type { MemberInfo } from "@/lib/members";

interface LeadDealsSectionProps {
  leadId: string;
  leadName: string;
  leadCompany: string | null;
  leadEmail: string | null;
  deals: Deal[];
  members: MemberInfo[];
}

export function LeadDealsSection({
  leadId,
  leadName,
  leadCompany,
  leadEmail,
  deals,
  members,
}: LeadDealsSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [, startTransition] = useTransition();

  const leadOptions = [{ id: leadId, name: leadName, company: leadCompany, email: leadEmail }];

  function handleOpenCreate() {
    setEditingDeal(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(deal: Deal) {
    setEditingDeal(deal);
    setDialogOpen(true);
  }

  function handleSubmit(deal: Deal) {
    const payload = {
      title: deal.title,
      lead_id: deal.lead_id,
      recurring_value: deal.recurring_value,
      setup_value: deal.setup_value,
      stage: deal.stage,
      owner_id: deal.owner_id,
      due_date: deal.due_date,
    };

    startTransition(async () => {
      if (editingDeal) {
        await updateDealAction(editingDeal.id, payload);
      } else {
        await createDealAction(payload);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteDealAction(id);
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Negociações
            {deals.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({deals.length})
              </span>
            )}
          </CardTitle>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleOpenCreate}>
            <Plus className="h-3.5 w-3.5" />
            Nova negociação
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {deals.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Nenhuma negociação para este lead.</p>
        ) : (
          <div className="divide-y divide-border">
            {deals.map((deal) => {
              const stage = STAGE_CONFIG[deal.stage];
              return (
                <button
                  key={deal.id}
                  onClick={() => handleOpenEdit(deal)}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{deal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {(deal.recurring_value ?? 0) > 0 &&
                        `R$ ${formatCurrencyValue(deal.recurring_value)}/mês`}
                      {(deal.setup_value ?? 0) > 0 &&
                        ` ${(deal.recurring_value ?? 0) > 0 ? "+ " : ""}R$ ${formatCurrencyValue(deal.setup_value)} setup`}
                      {(deal.recurring_value ?? 0) === 0 && (deal.setup_value ?? 0) === 0 && "Sem valor"}
                    </p>
                  </div>
                  <Badge
                    style={{
                      background: `${stage.color}18`,
                      color: stage.color,
                      border: `1px solid ${stage.color}30`,
                    }}
                    className="shrink-0"
                  >
                    {stage.label}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>

      <DealFormDialog
        open={dialogOpen}
        deal={editingDeal}
        leads={leadOptions}
        members={members}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </Card>
  );
}

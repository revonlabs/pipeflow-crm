"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CurrencyInput } from "@/components/ui/currency-input";
import { parseCurrencyInput, formatCurrencyValue } from "@/lib/format-currency";
import { createLeadInlineAction } from "@/lib/actions/leads";
import { STAGE_CONFIG } from "./kanban-board";
import { LostReasonDialog } from "./lost-reason-dialog";
import { DealActivitySection } from "./deal-activity-section";
import type { Deal, DealStage, LostReason } from "@/types";
import type { MemberInfo } from "@/lib/members";

interface LeadOption {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
}

const dealSchema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres"),
  lead_id: z.string().optional(),
  new_lead_name: z.string().optional(),
  new_lead_email: z.string().optional(),
  new_lead_phone: z.string().optional(),
  new_lead_company: z.string().optional(),
  recurring_value: z.string().optional(),
  setup_value: z.string().optional(),
  stage: z.enum(["new_lead", "contacted", "proposal_sent", "negotiation", "won", "lost"]),
  owner_id: z.string().optional(),
  due_date: z.string().optional(),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface DealFormDialogProps {
  open: boolean;
  deal?: Deal | null;
  defaultStage?: DealStage;
  leads: LeadOption[];
  members: MemberInfo[];
  lostReasons: LostReason[];
  workspaceId: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (deal: Deal) => void;
  onDelete?: (id: string) => void;
  onScheduleTask?: (dealId: string, dueAt: string) => void;
}

const monoStyle = { fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" } as const;
const labelClass = "text-[10px] font-medium uppercase tracking-[0.14em] text-[#555559]";

export function DealFormDialog({
  open,
  deal,
  defaultStage = "new_lead",
  leads,
  members,
  lostReasons,
  workspaceId,
  onOpenChange,
  onSubmit,
  onDelete,
  onScheduleTask,
}: DealFormDialogProps) {
  const isEditing = !!deal;
  const [nextContact, setNextContact] = useState("");
  const [leadMode, setLeadMode] = useState<"existing" | "new">("existing");
  const [leadError, setLeadError] = useState<string | null>(null);
  const [isCreatingLead, setIsCreatingLead] = useState(false);

  const [lostConfirmOpen, setLostConfirmOpen] = useState(false);
  const [pendingLostReasonId, setPendingLostReasonId] = useState<string | null>(null);

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: "",
      lead_id: "",
      new_lead_name: "",
      new_lead_email: "",
      new_lead_phone: "",
      new_lead_company: "",
      recurring_value: "",
      setup_value: "",
      stage: defaultStage,
      owner_id: "",
      due_date: "",
    },
  });

  useEffect(() => {
    if (open) {
      setLeadMode("existing");
      setLeadError(null);
      setPendingLostReasonId(deal?.lost_reason_id ?? null);
      if (deal) {
        form.reset({
          title: deal.title,
          lead_id: deal.lead_id,
          new_lead_name: "",
          new_lead_email: "",
          new_lead_phone: "",
          new_lead_company: "",
          recurring_value: deal.recurring_value ? formatCurrencyValue(deal.recurring_value) : "",
          setup_value: deal.setup_value ? formatCurrencyValue(deal.setup_value) : "",
          stage: deal.stage,
          owner_id: deal.owner_id ?? "",
          due_date: deal.due_date ?? "",
        });
        setNextContact(deal.next_task?.due_at ? deal.next_task.due_at.slice(0, 16) : "");
      } else {
        form.reset({
          title: "",
          lead_id: "",
          new_lead_name: "",
          new_lead_email: "",
          new_lead_phone: "",
          new_lead_company: "",
          recurring_value: "",
          setup_value: "",
          stage: defaultStage,
          owner_id: "",
          due_date: "",
        });
        setNextContact("");
      }
    }
  }, [open, deal, defaultStage, form]);

  async function handleSubmit(values: DealFormValues) {
    let leadId = values.lead_id;
    let leadOption = leads.find((l) => l.id === leadId);

    if (leadMode === "new") {
      setLeadError(null);
      if (!values.new_lead_name || !values.new_lead_email) {
        setLeadError("Nome e e-mail são obrigatórios para o novo lead.");
        return;
      }

      setIsCreatingLead(true);
      let result: Awaited<ReturnType<typeof createLeadInlineAction>>;
      try {
        result = await createLeadInlineAction({
          name: values.new_lead_name,
          email: values.new_lead_email,
          phone: values.new_lead_phone || undefined,
          company: values.new_lead_company || undefined,
        });
      } catch {
        setIsCreatingLead(false);
        setLeadError("Erro inesperado ao criar o lead. Tente novamente.");
        return;
      }
      setIsCreatingLead(false);

      if ("error" in result) {
        setLeadError(result.error);
        return;
      }

      leadId = result.lead.id;
      leadOption = result.lead;
    }

    if (!leadId) {
      setLeadError("Selecione um lead.");
      return;
    }

    const recurring_value = parseCurrencyInput(values.recurring_value);
    const setup_value = parseCurrencyInput(values.setup_value);

    const result: Deal = {
      id: deal?.id ?? `deal-${Date.now()}`,
      workspace_id: deal?.workspace_id ?? "",
      lead_id: leadId,
      title: values.title,
      value: recurring_value + setup_value,
      recurring_value,
      setup_value,
      stage: values.stage as DealStage,
      owner_id: values.owner_id || null,
      due_date: values.due_date || null,
      position: deal?.position ?? 0,
      created_at: deal?.created_at ?? new Date().toISOString(),
      lost_reason_id: values.stage === "lost" ? pendingLostReasonId : null,
      lead: leadOption
        ? { id: leadOption.id, name: leadOption.name, company: leadOption.company, email: leadOption.email }
        : deal?.lead,
      next_task: deal?.next_task,
    };

    onSubmit(result);

    if (nextContact && onScheduleTask) {
      onScheduleTask(result.id, new Date(nextContact).toISOString());
    }

    onOpenChange(false);
  }

  function handleDelete() {
    if (deal && onDelete) {
      onDelete(deal.id);
      onOpenChange(false);
    }
  }

  function handleStageChange(nextStage: string) {
    const previousStage = form.getValues("stage");
    if (nextStage === "lost" && previousStage !== "lost") {
      setLostConfirmOpen(true);
      return;
    }
    if (nextStage !== "lost") {
      setPendingLostReasonId(null);
    }
    form.setValue("stage", nextStage as DealStage);
  }

  function handleLostConfirm(reasonId: string) {
    setPendingLostReasonId(reasonId);
    form.setValue("stage", "lost");
    setLostConfirmOpen(false);
  }

  function handleLostCancel() {
    setLostConfirmOpen(false);
  }

  const currentStage = form.watch("stage") as DealStage;
  const stageColor = STAGE_CONFIG[currentStage]?.color ?? "#CAFF33";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="w-full sm:max-w-[640px] sm:min-w-[560px] p-0 gap-0 overflow-y-auto"
          style={{ backgroundColor: "#141416", borderColor: "#2A2A2E" }}
        >
          <div className="px-5 pt-5 pb-4 border-b shrink-0" style={{ borderColor: "#1E1E22" }}>
            <SheetHeader className="p-0">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: stageColor }} />
                <SheetTitle
                  className="text-[15px] font-bold text-[#E8E8E8]"
                  style={{ fontFamily: "var(--font-sans, 'Inter', sans-serif)" }}
                >
                  {isEditing ? "Editar negócio" : "Novo negócio"}
                </SheetTitle>
              </div>
            </SheetHeader>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1">
              <div className="px-5 py-4 space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass} style={monoStyle}>Título do negócio</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Proposta Enterprise — Q1 2025"
                          className="border-[#2A2A2E] bg-[#1A1A1E] text-[#E8E8E8] placeholder:text-[#555559] focus-visible:ring-[#CAFF33]/30 focus-visible:border-[#CAFF33]/40"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3 min-w-0">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <FormLabel className={labelClass} style={monoStyle}>Lead</FormLabel>
                      {!isEditing && (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setLeadMode("existing")}
                            className="text-[10px] px-1.5 py-0.5 rounded-sm transition-colors"
                            style={{
                              color: leadMode === "existing" ? "#CAFF33" : "#555559",
                              backgroundColor: leadMode === "existing" ? "#CAFF3318" : "transparent",
                            }}
                          >
                            Existente
                          </button>
                          <button
                            type="button"
                            onClick={() => setLeadMode("new")}
                            className="text-[10px] px-1.5 py-0.5 rounded-sm transition-colors"
                            style={{
                              color: leadMode === "new" ? "#CAFF33" : "#555559",
                              backgroundColor: leadMode === "new" ? "#CAFF3318" : "transparent",
                            }}
                          >
                            Novo
                          </button>
                        </div>
                      )}
                    </div>

                    {leadMode === "existing" ? (
                      <FormField
                        control={form.control}
                        name="lead_id"
                        render={({ field }) => (
                          <FormItem className="min-w-0">
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="min-w-0 overflow-hidden border-[#2A2A2E] bg-[#1A1A1E] text-[#E8E8E8] focus:ring-[#CAFF33]/30">
                                  <SelectValue placeholder="Selecionar" className="truncate" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent style={{ backgroundColor: "#141416", borderColor: "#2A2A2E" }}>
                                {leads.map((lead) => (
                                  <SelectItem
                                    key={lead.id}
                                    value={lead.id}
                                    className="text-[#E8E8E8] focus:bg-[#1A1A1E] focus:text-[#CAFF33]"
                                  >
                                    <span className="text-[13px]">{lead.name}</span>
                                    {lead.company && (
                                      <span className="text-[11px] text-[#555559] ml-1">· {lead.company}</span>
                                    )}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <p className="text-[12px] text-[#8A8A8F] truncate h-9 flex items-center">Preencher abaixo</p>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className={labelClass} style={monoStyle}>Estágio</FormLabel>
                        <Select onValueChange={handleStageChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="min-w-0 overflow-hidden border-[#2A2A2E] bg-[#1A1A1E] text-[#E8E8E8] focus:ring-[#CAFF33]/30">
                              <SelectValue className="truncate" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent style={{ backgroundColor: "#141416", borderColor: "#2A2A2E" }}>
                            {(Object.entries(STAGE_CONFIG) as [DealStage, { label: string; color: string }][]).map(
                              ([key, { label, color }]) => (
                                <SelectItem
                                  key={key}
                                  value={key}
                                  className="text-[#E8E8E8] focus:bg-[#1A1A1E] focus:text-[#CAFF33]"
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full inline-block shrink-0" style={{ backgroundColor: color }} />
                                    <span className="text-[13px] truncate">{label}</span>
                                  </span>
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {leadMode === "new" && !isEditing && (
                  <div className="grid grid-cols-2 gap-3 rounded-md border border-[#2A2A2E] bg-[#1A1A1E]/40 p-3">
                    <FormField
                      control={form.control}
                      name="new_lead_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass} style={monoStyle}>Nome*</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome do lead"
                              className="border-[#2A2A2E] bg-[#1A1A1E] text-[#E8E8E8] placeholder:text-[#555559] focus-visible:ring-[#CAFF33]/30 focus-visible:border-[#CAFF33]/40"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="new_lead_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass} style={monoStyle}>E-mail*</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="email@exemplo.com"
                              className="border-[#2A2A2E] bg-[#1A1A1E] text-[#E8E8E8] placeholder:text-[#555559] focus-visible:ring-[#CAFF33]/30 focus-visible:border-[#CAFF33]/40"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="new_lead_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass} style={monoStyle}>Telefone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(00) 00000-0000"
                              className="border-[#2A2A2E] bg-[#1A1A1E] text-[#E8E8E8] placeholder:text-[#555559] focus-visible:ring-[#CAFF33]/30 focus-visible:border-[#CAFF33]/40"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="new_lead_company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass} style={monoStyle}>Empresa</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome da empresa"
                              className="border-[#2A2A2E] bg-[#1A1A1E] text-[#E8E8E8] placeholder:text-[#555559] focus-visible:ring-[#CAFF33]/30 focus-visible:border-[#CAFF33]/40"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {leadError && <p className="text-[12px] text-[#FF4757]">{leadError}</p>}

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="recurring_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass} style={monoStyle}>Valor recorrente (R$/mês)</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            placeholder="0,00"
                            className="border-[#2A2A2E] bg-[#1A1A1E] text-[#E8E8E8] placeholder:text-[#555559] focus-visible:ring-[#CAFF33]/30 focus-visible:border-[#CAFF33]/40"
                            style={monoStyle}
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="setup_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass} style={monoStyle}>Valor de setup (R$)</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            placeholder="0,00"
                            className="border-[#2A2A2E] bg-[#1A1A1E] text-[#E8E8E8] placeholder:text-[#555559] focus-visible:ring-[#CAFF33]/30 focus-visible:border-[#CAFF33]/40"
                            style={monoStyle}
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="owner_id"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className={labelClass} style={monoStyle}>Responsável</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="min-w-0 overflow-hidden border-[#2A2A2E] bg-[#1A1A1E] text-[#E8E8E8] focus:ring-[#CAFF33]/30">
                              <SelectValue placeholder="Ninguém" className="truncate" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent style={{ backgroundColor: "#141416", borderColor: "#2A2A2E" }}>
                            {members.map((m) => (
                              <SelectItem
                                key={m.id}
                                value={m.id}
                                className="text-[#E8E8E8] focus:bg-[#1A1A1E] focus:text-[#CAFF33]"
                              >
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass} style={monoStyle}>Previsão de fechamento</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="border-[#2A2A2E] bg-[#1A1A1E] text-[#E8E8E8] focus-visible:ring-[#CAFF33]/30 focus-visible:border-[#CAFF33]/40"
                            style={monoStyle}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel className={labelClass} style={monoStyle}>Próximo contato</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        className="border-[#2A2A2E] bg-[#1A1A1E] text-[#E8E8E8] focus-visible:ring-[#CAFF33]/30 focus-visible:border-[#CAFF33]/40"
                        style={monoStyle}
                        value={nextContact}
                        onChange={(e) => setNextContact(e.target.value)}
                      />
                    </FormControl>
                  </FormItem>
                </div>
              </div>

              <Separator style={{ backgroundColor: "#1E1E22" }} />

              {isEditing && deal ? (
                <DealActivitySection
                  dealId={deal.id}
                  leadId={deal.lead_id}
                  workspaceId={workspaceId}
                />
              ) : (
                <p className="px-5 py-4 text-[12px] text-[#555559]">
                  Salve o negócio para registrar atividades.
                </p>
              )}

              <Separator style={{ backgroundColor: "#1E1E22" }} />

              <div className="px-5 py-3.5 flex items-center justify-between shrink-0 sticky bottom-0" style={{ backgroundColor: "#141416" }}>
                {isEditing && onDelete ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-[#FF4757] hover:text-[#FF4757] hover:bg-[#FF4757]/10 gap-1.5 text-[12px]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent style={{ backgroundColor: "#141416", borderColor: "#2A2A2E" }}>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-[#E8E8E8]">Excluir negócio?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#8A8A8F]">
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-[#2A2A2E] bg-transparent text-[#8A8A8F] hover:bg-[#1A1A1E]">
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-[#FF4757] hover:bg-[#FF4757]/80 text-white border-0"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[#8A8A8F] hover:text-[#E8E8E8] hover:bg-[#1A1A1E] text-[12px]"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isCreatingLead}
                    className="text-[12px] font-semibold border-0 disabled:opacity-60"
                    style={{ backgroundColor: "#CAFF33", color: "#0C0C0E" }}
                  >
                    {isCreatingLead ? "Salvando..." : isEditing ? "Salvar" : "Criar negócio"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <LostReasonDialog
        open={lostConfirmOpen}
        dealTitle={form.getValues("title") || "este negócio"}
        reasons={lostReasons}
        onConfirm={handleLostConfirm}
        onCancel={handleLostCancel}
      />
    </>
  );
}

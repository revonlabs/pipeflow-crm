"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateDigestConfigAction } from "@/lib/actions/wa-settings";
import type { WaDigestConfig } from "@/lib/actions/wa-settings";

const schema = z.object({
  scheduleTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
  periodHours: z.union([z.literal(24), z.literal(48), z.literal(168)]),
  enabled: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

// schedule_time é salvo em UTC no banco (o worker compara contra a janela do
// cron, que roda em UTC) — o formulário sempre mostra/recebe horário local do
// navegador do admin e converte nas duas pontas. Usa a data de hoje como
// referência só para o cálculo de offset; o valor salvo é HH:MM em UTC.
function localTimeToUtc(localTime: string): string {
  const [hours, minutes] = localTime.split(":").map(Number);
  const reference = new Date();
  reference.setHours(hours, minutes, 0, 0);
  return `${String(reference.getUTCHours()).padStart(2, "0")}:${String(reference.getUTCMinutes()).padStart(2, "0")}`;
}

function utcTimeToLocal(utcTime: string): string {
  const [hours, minutes] = utcTime.split(":").map(Number);
  const reference = new Date();
  reference.setUTCHours(hours, minutes, 0, 0);
  return `${String(reference.getHours()).padStart(2, "0")}:${String(reference.getMinutes()).padStart(2, "0")}`;
}

const PERIOD_OPTIONS: { value: 24 | 48 | 168; label: string }[] = [
  { value: 24, label: "Últimas 24 horas" },
  { value: 48, label: "Últimas 48 horas" },
  { value: 168, label: "Últimos 7 dias" },
];

interface WaDigestSettingsFormProps {
  config: WaDigestConfig;
}

export function WaDigestSettingsForm({ config }: WaDigestSettingsFormProps) {
  const [serverMessage, setServerMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      scheduleTime: utcTimeToLocal(config.scheduleTime),
      periodHours: config.periodHours,
      enabled: config.enabled,
    },
  });

  function onSubmit(values: FormValues) {
    setServerMessage(null);
    startTransition(async () => {
      const result = await updateDigestConfigAction({
        ...values,
        scheduleTime: localTimeToUtc(values.scheduleTime),
      });
      if (result.error) {
        setServerMessage({ type: "error", text: result.error });
      } else {
        setServerMessage({ type: "success", text: "Configuração salva com sucesso." });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="enabled">Resumo diário ativo</Label>
          <p className="text-xs text-muted-foreground">
            Envia um e-mail com as métricas do período para os administradores do workspace.
          </p>
        </div>
        <Controller
          name="enabled"
          control={control}
          render={({ field }) => (
            <Switch id="enabled" checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="scheduleTime">Horário de envio</Label>
        <Input
          id="scheduleTime"
          type="time"
          disabled={isPending}
          className={errors.scheduleTime ? "border-red-500/60" : ""}
          {...register("scheduleTime")}
        />
        <p className="text-xs text-muted-foreground">
          O envio pode atrasar até 15 minutos do horário escolhido.
        </p>
        {errors.scheduleTime && <p className="text-xs text-red-400">{errors.scheduleTime.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="periodHours">Período do resumo</Label>
        <Controller
          name="periodHours"
          control={control}
          render={({ field }) => (
            <Select
              value={String(field.value)}
              onValueChange={(value) => field.onChange(Number(value) as 24 | 48 | 168)}
              disabled={isPending}
            >
              <SelectTrigger id="periodHours">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {config.lastSentAt && (
        <p className="text-xs text-muted-foreground">
          Último envio: {new Date(config.lastSentAt).toLocaleString("pt-BR")}
        </p>
      )}

      {serverMessage && (
        <p
          className={`text-sm rounded-lg px-3 py-2 border ${
            serverMessage.type === "success"
              ? "text-green-400 bg-green-500/10 border-green-500/20"
              : "text-red-400 bg-red-500/10 border-red-500/20"
          }`}
        >
          {serverMessage.text}
        </p>
      )}

      <Button type="submit" disabled={!isDirty || isPending} className="gap-2">
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Salvar alterações
      </Button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const workspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(50, "Nome deve ter no máximo 50 caracteres"),
});

type WorkspaceValues = z.infer<typeof workspaceSchema>;

export function WorkspaceForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WorkspaceValues>({ resolver: zodResolver(workspaceSchema) });

  async function onSubmit(_values: WorkspaceValues) {
    // Mock: simula criação do workspace e redireciona pro dashboard
    await new Promise((r) => setTimeout(r, 800));
    router.push("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="workspace-name" className="text-white/70">
          Nome do workspace
        </Label>
        <Input
          id="workspace-name"
          type="text"
          placeholder="Ex: Acme Vendas, Freelancer Pro…"
          autoFocus
          className={cn(
            "border-white/10 bg-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#4F8EF7]",
            errors.name && "border-red-500/60"
          )}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-red-400">{errors.name.message}</p>
        )}
        <p className="text-xs text-white/30">
          Você pode alterar isso depois nas configurações.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#4F8EF7] text-white hover:bg-[#3d7de6] disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando workspace…
          </>
        ) : (
          "Criar workspace e começar"
        )}
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordValues) {
    setServerError(null);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setServerError("Não foi possível redefinir sua senha. O link pode ter expirado.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Definir nova senha</h1>
        <p className="mt-1 text-sm text-white/50">
          Escolha uma nova senha para acessar sua conta.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-white/70">
            Nova senha
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            className={cn(
              "border-white/10 bg-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#4F8EF7]",
              errors.password && "border-red-500/60"
            )}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-white/70">
            Confirmar senha
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            className={cn(
              "border-white/10 bg-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#4F8EF7]",
              errors.confirmPassword && "border-red-500/60"
            )}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>

        {serverError && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#4F8EF7] text-white hover:bg-[#3d7de6] disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando…
            </>
          ) : (
            "Redefinir senha"
          )}
        </Button>
      </form>
    </div>
  );
}

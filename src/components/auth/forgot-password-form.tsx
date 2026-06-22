"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordValues) {
    setServerError(null);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
    });
    if (error) {
      setServerError("Não foi possível enviar o link. Tente novamente em alguns minutos.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="h-10 w-10 text-[#3BFFA0]" />
          <h1 className="mt-4 text-2xl font-semibold text-white">Verifique seu e-mail</h1>
          <p className="mt-2 text-sm text-white/50">
            Se houver uma conta com esse e-mail, enviamos um link para redefinir sua senha.
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-white/40">
          <Link href="/login" className="text-[#4F8EF7] hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Recuperar senha</h1>
        <p className="mt-1 text-sm text-white/50">
          Enviaremos um link de redefinição para o seu e-mail.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-white/70">
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="voce@empresa.com"
            autoComplete="email"
            className={cn(
              "border-white/10 bg-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#4F8EF7]",
              errors.email && "border-red-500/60"
            )}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
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
              Enviando…
            </>
          ) : (
            "Enviar link de recuperação"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-white/40">
        Lembrou a senha?{" "}
        <Link href="/login" className="text-[#4F8EF7] hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = { title: "Recuperar senha — Revon Studio CRM" };

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Recuperar senha</h1>
        <p className="mt-1 text-sm text-white/50">
          Enviaremos um link de redefinição para o seu e-mail.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-white/70">
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="voce@empresa.com"
            disabled
            className="border-white/10 bg-white/10 text-white placeholder:text-white/25 opacity-50 cursor-not-allowed"
          />
        </div>

        <Button
          disabled
          className="w-full bg-[#4F8EF7] text-white opacity-50 cursor-not-allowed"
        >
          Enviar link de recuperação
        </Button>

        <p className="text-center text-xs text-white/30">
          Disponível após integração com Supabase Auth
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-white/40">
        Lembrou a senha?{" "}
        <Link href="/login" className="text-[#4F8EF7] hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}

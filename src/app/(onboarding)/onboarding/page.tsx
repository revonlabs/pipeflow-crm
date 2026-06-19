import type { Metadata } from "next";
import { WorkspaceForm } from "@/components/auth/workspace-form";

export const metadata: Metadata = { title: "Configurar workspace — Revon Studio CRM" };

export default function OnboardingPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#060B14]">
      {/* Orbs de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-crm-surface-2 opacity-40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-20 h-[400px] w-[400px] rounded-full bg-crm-accent opacity-20 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-md px-4 py-12">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-crm-accent">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="h-6 w-6 text-white"
              aria-hidden
            >
              <path d="M10 2L3 7v11h5v-5h4v5h5V7L10 2z" fill="currentColor" />
            </svg>
          </div>
          <span className="text-xl tracking-tight text-white">
            <span className="font-black">Revon</span>{" "}
            <span className="font-light text-[#8BACD4] uppercase tracking-[0.1em]">Studio CRM</span>
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          {/* Progresso */}
          <div className="mb-6 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-crm-accent" />
            <div className="h-1.5 flex-1 rounded-full bg-white/10" />
            <div className="h-1.5 flex-1 rounded-full bg-white/10" />
          </div>

          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-widest text-crm-accent">
              Passo 1 de 1
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              Crie seu workspace
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Um workspace é o espaço onde você e sua equipe gerenciam leads e negócios.
            </p>
          </div>

          <WorkspaceForm />
        </div>
      </div>
    </div>
  );
}

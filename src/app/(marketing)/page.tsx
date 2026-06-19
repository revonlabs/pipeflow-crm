import Link from "next/link";
import { BarChart3, Users, Globe, ShieldCheck, Bell, Check, ArrowRight } from "lucide-react";
import { LandingNavbar } from "@/components/landing/navbar";

/* ─── Data ─── */

const FEATURES = [
  {
    icon: BarChart3,
    title: "Pipeline Kanban Visual",
    description:
      "Arraste e solte negócios entre etapas. Visualize todo o seu funil de vendas em um único lugar, em tempo real.",
  },
  {
    icon: Users,
    title: "Gestão de Leads Completa",
    description:
      "Cadastre, filtre e acompanhe cada contato com histórico de atividades, notas, ligações e reuniões.",
  },
  {
    icon: BarChart3,
    title: "Dashboard de Métricas",
    description:
      "Acompanhe taxa de conversão, valor do pipeline e negócios próximos do fechamento em cards e gráficos.",
  },
  {
    icon: Bell,
    title: "Alertas de Prazo",
    description:
      "Nunca perca um follow-up. Negócios com prazo vencido são destacados automaticamente no board.",
  },
  {
    icon: Globe,
    title: "Multi-Workspace",
    description:
      "Gerencie vários times ou empresas em um único login. Troque de workspace com um clique.",
  },
  {
    icon: ShieldCheck,
    title: "Segurança e Privacidade",
    description:
      "Row-Level Security no banco de dados. Cada workspace vê apenas os seus próprios dados.",
  },
];

const STATS = [
  { value: "+47%", label: "aumento na conversão" },
  { value: "3.2x", label: "mais leads qualificados" },
  { value: "−62%", label: "ciclo de venda" },
  { value: "1200+", label: "times usando hoje" },
];

const FREE_FEATURES = [
  "2 colaboradores",
  "50 leads",
  "1 workspace",
  "Pipeline Kanban",
  "Dashboard básico",
];

const PRO_FEATURES = [
  "Colaboradores ilimitados",
  "Leads ilimitados",
  "Workspaces ilimitados",
  "Pipeline Kanban",
  "Dashboard completo",
  "Alertas e relatórios",
  "Suporte prioritário",
];

const PIPELINE_STAGES = [
  { label: "Novo Lead",   color: "#4A90E2", count: 8 },
  { label: "Contato",     color: "#FFAB40", count: 5 },
  { label: "Proposta",    color: "#FF7043", count: 3 },
  { label: "Negociação",  color: "#CE59B2", count: 2 },
  { label: "Ganho",       color: "#3BFFA0", count: 4 },
];

/* ─── Page ─── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060B14] text-[#F0F8FF] overflow-x-hidden">
      <LandingNavbar />

      {/* ══ HERO ══ */}
      <section className="relative flex flex-col items-center px-4 pt-28 pb-16 text-center md:pt-36">
        {/* Orb top-center */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-[#FF7043] opacity-[0.055] blur-[130px]"
        />
        <div aria-hidden className="pointer-events-none absolute -left-24 top-32 h-64 w-64 rounded-full bg-[#4A90E2] opacity-[0.09] blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-16 bottom-24 h-56 w-56 rounded-full bg-[#FF7043] opacity-[0.06] blur-3xl" />

        {/* Badge */}
        <span className="lp-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-[#FF7043]/20 bg-[#FF7043]/5 px-4 py-1.5 text-xs font-medium text-[#FF7043]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF7043] animate-pulse" />
          Pipeline Kanban · Multi-workspace · Free/Pro
        </span>

        {/* Headline */}
        <h1 className="lp-fade-up-1 relative z-10 max-w-4xl font-display text-5xl font-bold leading-[1.06] tracking-tight text-white md:text-7xl lg:text-[80px]">
          Feche mais negócios.{" "}
          <span className="text-[#FF7043]" style={{ textShadow: "0 0 40px rgba(255,112,67,0.3)" }}>
            Com clareza.
          </span>
        </h1>

        {/* Sub */}
        <p className="lp-fade-up-2 relative z-10 mx-auto mt-6 max-w-lg text-base leading-relaxed text-[#8BACD4] md:text-lg">
          PipeFlow é o CRM para PMEs e times de vendas brasileiros. Pipeline Kanban
          visual, gestão de leads, métricas em tempo real — tudo no mesmo lugar.
        </p>

        {/* CTAs */}
        <div className="lp-fade-up-3 relative z-10 mt-10 flex flex-col items-stretch gap-3 w-full max-w-xs sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FF7043] px-7 py-3.5 text-sm font-semibold text-[#060B14] transition-all duration-200 hover:bg-[#FF7043] hover:shadow-[0_0_32px_rgba(255,112,67,0.35)] active:scale-[0.98]"
          >
            Começar grátis
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2A2A2E] px-7 py-3.5 text-sm font-medium text-[#F0F8FF] transition-all duration-200 hover:border-[#FF7043]/30 hover:bg-[#FF7043]/5"
          >
            Ver funcionalidades
          </Link>
        </div>

        <p className="lp-fade-up-3 relative z-10 mt-5 text-xs text-[#4A6785]">
          Sem cartão de crédito · Plano gratuito para sempre
        </p>

        {/* Pipeline preview */}
        <div className="lp-fade-up-4 relative z-10 mt-16 w-full max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-[#2A2A2E] bg-[#060B14] shadow-2xl">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 border-b border-[#1E1E22] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF4444]/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FFAB40]/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#3BFFA0]/70" />
              <span className="ml-4 font-mono text-[10px] text-[#4A6785]">
                pipeflow.app/pipeline
              </span>
            </div>
            {/* Kanban columns */}
            <div className="flex gap-3 p-4 pb-5 overflow-x-auto">
              {PIPELINE_STAGES.map((stage, i) => (
                <div
                  key={stage.label}
                  className={`flex w-44 shrink-0 flex-col gap-2 rounded-lg border border-[#1E1E22] bg-[#0D1B2E] p-3${i >= 3 ? " hidden md:flex" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: stage.color }} />
                    <span className="text-[10px] font-medium text-[#8BACD4]">{stage.label}</span>
                    <span className="ml-auto font-mono text-[10px] text-[#4A6785]">{stage.count}</span>
                  </div>
                  {Array.from({ length: Math.min(stage.count, 3) }).map((_, j) => (
                    <div
                      key={j}
                      className="h-12 rounded-md border border-[#2A2A2E] bg-[#0D1B2E] px-2.5 py-2"
                      style={{ borderLeftWidth: 2, borderLeftColor: stage.color, opacity: 1 - j * 0.15 }}
                    >
                      <div className="h-1.5 w-16 rounded bg-[#2A2A2E]" />
                      <div className="mt-1.5 h-1 w-10 rounded bg-[#1E1E22]" />
                      <div className="mt-2 h-1 w-14 rounded bg-[#1E1E22]" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section className="border-y border-[#1E1E22] bg-[#060B14] px-4 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-10 md:grid-cols-4">
          {STATS.map((s, i) => (
            <div key={s.value} className={`lp-fade-up-${i + 1} flex flex-col items-center gap-1 text-center`}>
              <span className="font-display text-4xl font-bold text-[#FF7043] md:text-5xl">
                {s.value}
              </span>
              <span className="text-sm text-[#8BACD4]">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
              Tudo que um time de vendas precisa
            </h2>
            <p className="mt-3 text-[#8BACD4]">
              Do primeiro contato ao fechamento — sem abas extras, sem planilhas.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-[#2A2A2E] bg-[#0D1B2E] p-6 transition-all duration-200 hover:border-[#FF7043]/25 hover:bg-[#0D1B2E]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF7043]/10">
                  <f.icon className="size-5 text-[#FF7043]" />
                </div>
                <h3 className="mb-2 font-display text-base font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[#8BACD4]">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="pricing" className="relative px-4 py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-64 w-[600px] rounded-full bg-[#FF7043] opacity-[0.04] blur-[80px]"
        />

        <div className="relative mx-auto max-w-4xl">
          <div className="mb-14 text-center">
            <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
              Preço simples. Sem surpresas.
            </h2>
            <p className="mt-3 text-[#8BACD4]">
              Comece grátis e faça upgrade quando precisar crescer.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Free */}
            <div className="flex flex-col rounded-xl border border-[#2A2A2E] bg-[#0D1B2E] p-8">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#8BACD4]">
                Grátis
              </p>
              <p className="font-display text-4xl font-bold text-white">
                R$0
                <span className="text-base font-normal text-[#8BACD4]">/mês</span>
              </p>
              <p className="mt-2 mb-8 text-sm text-[#8BACD4]">
                Para freelancers e times pequenos.
              </p>
              <ul className="mb-8 flex-1 space-y-3">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-[#F0F8FF]">
                    <Check className="size-4 shrink-0 text-[#3BFFA0]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block w-full rounded-lg border border-[#2A2A2E] py-3 text-center text-sm font-medium text-[#F0F8FF] transition-all duration-200 hover:border-[#FF7043]/30 hover:bg-[#FF7043]/5"
              >
                Começar grátis
              </Link>
            </div>

            {/* Pro */}
            <div
              className="relative flex flex-col overflow-hidden rounded-xl border border-[#FF7043]/30 bg-[#0D1B2E] p-8"
              style={{ boxShadow: "inset 0 0 50px rgba(255,112,67,0.05), 0 0 40px rgba(255,112,67,0.06)" }}
            >
              <span className="absolute right-6 top-6 rounded-full bg-[#FF7043] px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#060B14]">
                Popular
              </span>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#FF7043]">
                Pro
              </p>
              <p className="font-display text-4xl font-bold text-white">
                R$49
                <span className="text-base font-normal text-[#8BACD4]">/mês</span>
              </p>
              <p className="mt-2 mb-8 text-sm text-[#8BACD4]">
                Para times que querem crescer sem limite.
              </p>
              <ul className="mb-8 flex-1 space-y-3">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-[#F0F8FF]">
                    <Check className="size-4 shrink-0 text-[#FF7043]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block w-full rounded-lg bg-[#FF7043] py-3 text-center text-sm font-semibold text-[#060B14] transition-all duration-200 hover:bg-[#FF7043] hover:shadow-[0_0_24px_rgba(255,112,67,0.3)] active:scale-[0.98]"
              >
                Assinar Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ══ */}
      <section className="relative overflow-hidden px-4 py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#FF7043]/[0.025] to-transparent"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-white md:text-5xl">
            Pronto para fechar mais negócios?
          </h2>
          <p className="mt-4 text-[#8BACD4]">
            Crie sua conta grátis em menos de 1 minuto. Sem cartão de crédito.
          </p>
          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:items-stretch-none">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FF7043] px-8 py-4 text-base font-semibold text-[#060B14] transition-all duration-200 hover:bg-[#FF7043] hover:shadow-[0_0_40px_rgba(255,112,67,0.4)] active:scale-[0.98]"
            >
              Criar conta grátis
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2A2A2E] px-8 py-4 text-base font-medium text-[#8BACD4] transition-all duration-200 hover:border-[#FF7043]/30 hover:text-[#F0F8FF]"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-[#1E1E22] px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF7043]">
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
                <circle cx="5" cy="10" r="2.5" fill="#060B14" />
                <circle cx="10" cy="6" r="2.5" fill="#060B14" />
                <circle cx="15" cy="10" r="2.5" fill="#060B14" />
                <path d="M7.5 10h5M10 8.5V6" stroke="#060B14" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-display text-sm font-bold text-white">PipeFlow</span>
          </div>
          <p className="text-xs text-[#4A6785]">
            © {new Date().getFullYear()} PipeFlow. Todos os direitos reservados.
          </p>
          <div className="flex gap-5 text-xs text-[#4A6785]">
            <Link href="#" className="transition-colors hover:text-[#FF7043]">Termos</Link>
            <Link href="#" className="transition-colors hover:text-[#FF7043]">Privacidade</Link>
            <Link href="#" className="transition-colors hover:text-[#FF7043]">Contato</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

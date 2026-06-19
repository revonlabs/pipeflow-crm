import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Revon Studio CRM — Gestão de clientes e vendas para times brasileiros",
  description:
    "Pipeline Kanban visual, multi-empresa e planos Free/Pro. Aumente sua conversão em até 47% com o CRM feito para PMEs e freelancers.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

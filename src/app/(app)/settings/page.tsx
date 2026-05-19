import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie seu workspace, membros e assinatura"
      />
      <EmptyState
        icon={Settings}
        title="Configurações em construção"
        description="As páginas de workspace, membros e billing serão implementadas em breve."
      />
    </div>
  );
}

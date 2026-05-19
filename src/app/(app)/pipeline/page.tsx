import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Kanban, Plus } from "lucide-react";

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description="Acompanhe seus negócios em cada etapa do funil"
        action={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Negócio
          </Button>
        }
      />
      <EmptyState
        icon={Kanban}
        title="Pipeline em construção"
        description="O board Kanban com drag-and-drop será implementado em breve."
      />
    </div>
  );
}

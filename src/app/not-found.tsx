import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">404</h1>
        <p className="text-muted-foreground">Página não encontrada.</p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Voltar para o Dashboard</Link>
      </Button>
    </div>
  );
}

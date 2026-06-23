"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import type { Workspace, WorkspaceRole } from "@/types";

interface MobileSidebarTriggerProps {
  activeWorkspace: Workspace;
  allWorkspaces: Workspace[];
  role: WorkspaceRole;
}

export function MobileSidebarTrigger({
  activeWorkspace,
  allWorkspaces,
  role,
}: MobileSidebarTriggerProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden shrink-0"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Abrir menu</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="p-0 w-60 border-r-0 [&>button]:hidden"
          style={{ backgroundColor: "#0D1B2E", borderRight: "1px solid #1E1E22" }}
        >
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <Sidebar
            activeWorkspace={activeWorkspace}
            allWorkspaces={allWorkspaces}
            role={role}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import type { Workspace } from "@/types";

interface MobileSidebarTriggerProps {
  activeWorkspace: Workspace;
  allWorkspaces: Workspace[];
}

export function MobileSidebarTrigger({
  activeWorkspace,
  allWorkspaces,
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
          className="p-0 w-60 bg-[#1B2559] border-r-0 [&>button]:hidden"
        >
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <Sidebar
            activeWorkspace={activeWorkspace}
            allWorkspaces={allWorkspaces}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

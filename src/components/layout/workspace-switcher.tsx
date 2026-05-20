"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { switchWorkspaceAction } from "@/lib/actions/workspace";
import type { Workspace } from "@/types";

interface WorkspaceSwitcherProps {
  activeWorkspace: Workspace;
  allWorkspaces: Workspace[];
}

export function WorkspaceSwitcher({ activeWorkspace, allWorkspaces }: WorkspaceSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-2 h-auto py-2 hover:bg-sidebar-accent text-sidebar-foreground"
        >
          <div className="flex items-center gap-2 min-w-0">
            <WorkspaceAvatar name={activeWorkspace.name} />
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-semibold truncate max-w-[130px]">
                {activeWorkspace.name}
              </span>
              <PlanBadge plan={activeWorkspace.plan} />
            </div>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-60" align="start" side="bottom">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          Workspaces
        </DropdownMenuLabel>

        {allWorkspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onSelect={() => switchWorkspaceAction(ws.id)}
            className="gap-2"
          >
            <WorkspaceAvatar name={ws.name} size="sm" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium truncate">{ws.name}</span>
              <PlanBadge plan={ws.plan} />
            </div>
            <Check
              className={cn(
                "h-4 w-4 shrink-0",
                activeWorkspace.id === ws.id ? "opacity-100" : "opacity-0"
              )}
            />
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem className="gap-2 text-muted-foreground" disabled>
          <div className="flex h-6 w-6 items-center justify-center rounded border border-dashed border-border">
            <Plus className="h-3 w-3" />
          </div>
          <span className="text-sm">Novo workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WorkspaceAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "shrink-0 rounded-md bg-[#4F8EF7]/20 font-bold text-[#4F8EF7] flex items-center justify-center",
        size === "md" ? "h-8 w-8 text-sm" : "h-6 w-6 text-xs"
      )}
    >
      {initials}
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  if (plan === "pro") {
    return (
      <Badge className="text-[10px] px-1 py-0 h-4 bg-[#4F8EF7]/20 text-[#4F8EF7] border-0 font-semibold">
        Pro
      </Badge>
    );
  }
  return <span className="text-[10px] text-muted-foreground font-medium">Free</span>;
}

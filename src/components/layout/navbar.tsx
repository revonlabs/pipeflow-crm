"use client";

import { Bell, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileSidebarTrigger } from "./mobile-sidebar";
import { signOutAction } from "@/lib/actions/auth";
import type { Workspace, WorkspaceRole } from "@/types";

interface NavbarProps {
  userName: string;
  userEmail: string;
  activeWorkspace: Workspace;
  allWorkspaces: Workspace[];
  role: WorkspaceRole;
}

export function Navbar({ userName, userEmail, activeWorkspace, allWorkspaces, role }: NavbarProps) {
  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || userEmail[0].toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4 lg:px-6">
      <MobileSidebarTrigger
        activeWorkspace={activeWorkspace}
        allWorkspaces={allWorkspaces}
        role={role}
      />

      <div className="flex-1" />

      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-4 w-4" />
        <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#4F8EF7]" />
        <span className="sr-only">Notificações</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 h-auto px-2 py-1.5"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#4F8EF7] text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-medium leading-none">{userName || userEmail}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{userEmail}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="font-semibold">{userName || userEmail}</span>
            <span className="text-xs text-muted-foreground font-normal">{userEmail}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="gap-2">
            <a href="/settings">
              <Settings className="h-4 w-4" />
              Configurações
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-destructive focus:text-destructive"
            onSelect={() => signOutAction()}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

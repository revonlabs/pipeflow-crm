"use client";

import { Bell, LogOut, User, Settings } from "lucide-react";
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

const MOCK_USER = {
  name: "Pedro Nezello",
  email: "pedro@acmecorp.com",
  initials: "PN",
};

export function Navbar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4 lg:px-6">
      {/* Hamburguer — só aparece em mobile */}
      <MobileSidebarTrigger />

      {/* Espaçador */}
      <div className="flex-1" />

      {/* Notificações */}
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-4 w-4" />
        <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#4F8EF7]" />
        <span className="sr-only">Notificações</span>
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 h-auto px-2 py-1.5"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#4F8EF7] text-white text-xs font-semibold">
                {MOCK_USER.initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-medium leading-none">
                {MOCK_USER.name}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                {MOCK_USER.email}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="font-semibold">{MOCK_USER.name}</span>
            <span className="text-xs text-muted-foreground font-normal">
              {MOCK_USER.email}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2">
            <User className="h-4 w-4" />
            Perfil
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

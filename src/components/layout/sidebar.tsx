"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Kanban, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { WorkspaceSwitcher } from "./workspace-switcher";
import type { Workspace } from "@/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/settings", label: "Configurações", icon: Settings },
];

interface SidebarProps {
  activeWorkspace: Workspace;
  allWorkspaces: Workspace[];
}

export function Sidebar({ activeWorkspace, allWorkspaces }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-full w-60 shrink-0 flex-col"
      style={{ backgroundColor: "#0D1B2E", borderRight: "1px solid #1E1E22" }}
    >
      {/* Logo */}
      <div
        className="flex items-center px-4 py-5 border-b"
        style={{ borderColor: "#1E1E22" }}
      >
        <Logo iconSize={28} />
      </div>

      {/* Workspace switcher */}
      <div className="px-2 py-3 border-b" style={{ borderColor: "#1E1E22" }}>
        <WorkspaceSwitcher
          activeWorkspace={activeWorkspace}
          allWorkspaces={allWorkspaces}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                isActive ? "text-[#FF7043]" : "text-[#4A6785] hover:text-[#8BACD4]"
              )}
              style={{
                backgroundColor: isActive ? "rgba(255,112,67,0.08)" : "transparent",
                fontFamily: "var(--font-sans, 'Inter', sans-serif)",
              }}
            >
              <Icon
                className="h-4 w-4 shrink-0"
                style={{ color: isActive ? "#FF7043" : "#4A6785" }}
              />
              {label}
              {isActive && (
                <div
                  className="ml-auto h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: "#FF7043" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "#1E1E22" }}>
        <p
          className="text-[10px] uppercase tracking-[0.14em] text-[#2A2A2E]"
          style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
        >
          Revon Studio CRM · v0.1
        </p>
      </div>
    </aside>
  );
}

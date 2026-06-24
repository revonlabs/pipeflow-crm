"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SUBNAV_ITEMS = [
  { href: "/wa", label: "Conversas" },
  { href: "/wa/metrics", label: "Métricas" },
  { href: "/wa/settings", label: "Configurações" },
];

export function WaSubnav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b" style={{ borderColor: "#1E1E22" }}>
      {SUBNAV_ITEMS.map(({ href, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "border-b-2" : "text-muted-foreground hover:text-foreground"
            )}
            style={isActive ? { color: "#FF7043", borderColor: "#FF7043" } : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

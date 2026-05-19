"use client";

import { useEffect } from "react";

/**
 * Adiciona class="dark" no <html> para que portais Radix (Dropdown, Sheet, Dialog)
 * — que são renderizados fora do div do AppLayout — herdem o dark mode correto.
 */
export function DarkModeEnforcer() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  return null;
}

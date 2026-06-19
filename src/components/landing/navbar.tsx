"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";

const NAV_LINKS = [
  { label: "Funcionalidades", href: "#features" },
  { label: "Preços", href: "#pricing" },
];

export function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Glassmorphism bar */}
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <nav className="flex items-center justify-between rounded-xl border border-[#2A2A2E] bg-[#060B14]/80 px-5 py-3 backdrop-blur-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF7043]">
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
                <circle cx="5" cy="10" r="2.5" fill="#060B14" />
                <circle cx="10" cy="6" r="2.5" fill="#060B14" />
                <circle cx="15" cy="10" r="2.5" fill="#060B14" />
                <path
                  d="M7.5 10h5M10 8.5v-2.5"
                  stroke="#060B14"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="font-display text-sm font-bold text-white">PipeFlow</span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-[#8BACD4] transition-colors hover:text-[#F0F8FF]"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="text-sm text-[#8BACD4] transition-colors hover:text-[#F0F8FF]"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF7043] px-4 py-2 text-sm font-semibold text-[#060B14] transition-all duration-200 hover:bg-[#FF7043] hover:shadow-[0_0_20px_rgba(255,112,67,0.3)]"
            >
              Começar grátis
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex items-center justify-center rounded-lg p-2 text-[#8BACD4] transition-colors hover:text-[#F0F8FF] md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>

        {/* Mobile menu */}
        {open && (
          <div className="mt-1 rounded-xl border border-[#2A2A2E] bg-[#060B14]/95 px-5 py-4 backdrop-blur-md md:hidden">
            <ul className="mb-4 flex flex-col gap-3">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="block text-sm text-[#8BACD4] transition-colors hover:text-[#F0F8FF]"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                className="block rounded-lg border border-[#2A2A2E] py-2.5 text-center text-sm text-[#8BACD4] transition-colors hover:text-[#F0F8FF]"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="block rounded-lg bg-[#FF7043] py-2.5 text-center text-sm font-semibold text-[#060B14]"
              >
                Começar grátis
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

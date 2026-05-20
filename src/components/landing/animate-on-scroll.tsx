"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimateOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/*
 * Renderiza visível por padrão (sem JS / SSR). Quando JS hidrata, aplica
 * fade-in ao entrar na viewport. Evita flash de conteúdo invisível em SSR.
 */
export function AnimateOnScroll({ children, className, delay = 0 }: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Começa como true — visível no SSR e antes da hidratação
  const [visible, setVisible] = useState(true);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Marca que JS está ativo; pode controlar a animação
    setAnimated(true);
    setVisible(false);

    const tryShow = () => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 40) {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
      }
    };

    // Checa imediatamente (elemento pode já estar na viewport)
    const cleanup = tryShow();
    if (cleanup) return cleanup;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -30px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={
        animated
          ? {
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.55s ease, transform 0.55s ease",
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

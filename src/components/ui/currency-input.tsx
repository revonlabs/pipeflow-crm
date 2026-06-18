"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function formatCentsToBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseCurrencyInput(masked: string | undefined | null): number {
  if (!masked) return 0;
  const digits = masked.replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

export function formatCurrencyValue(value: number): string {
  return formatCentsToBRL(Math.round(value * 100));
}

interface CurrencyInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: string;
  onValueChange: (masked: string) => void;
}

export function CurrencyInput({ value, onValueChange, className, ...props }: CurrencyInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    const cents = digits ? parseInt(digits, 10) : 0;
    onValueChange(formatCentsToBRL(cents));
  }

  return (
    <Input
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      className={cn(className)}
      {...props}
    />
  );
}

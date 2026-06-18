"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCentsToBRL } from "@/lib/format-currency";

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

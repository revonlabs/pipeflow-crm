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

export { formatCentsToBRL };

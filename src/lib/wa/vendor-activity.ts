// Janela de aviso "vendedor pode estar respondendo agora" (spec §9.1).
const VENDOR_ACTIVE_WINDOW_MS = 2 * 60 * 1000;

export function isVendorLikelyActive(minutesSinceLastActivity: number | null): boolean {
  if (minutesSinceLastActivity === null) return false;
  return minutesSinceLastActivity * 60_000 < VENDOR_ACTIVE_WINDOW_MS;
}

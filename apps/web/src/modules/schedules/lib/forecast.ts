import type { ForecastMaterial } from "../schemas/forecast-schema";

/** Stock on hand that has not expired; only this can go into production. */
export function usableStock(item: Pick<ForecastMaterial, "onHand" | "expired"> & { usable?: number | null; unavailable?: number }): number {
  return typeof item.usable === "number" ? Math.max(item.usable, 0) : Math.max(item.onHand - item.expired - (item.unavailable ?? 0), 0);
}

/** Usable stock not reserved for other batches: what new production could actually be issued. The server's figure when sent. */
export function freeStock(item: Pick<ForecastMaterial, "onHand" | "expired" | "reserved"> & { usable?: number | null; unavailable?: number; free?: number | null }): number {
  return typeof item.free === "number" ? Math.max(item.free, 0) : Math.max(usableStock(item) - item.reserved, 0);
}

/**
 * Whether the free stock covers the need, the rule production applies when a batch starts. The server's answer is
 * used when it gives one (it applies the same rule); otherwise the rule is applied here.
 */
export function isCovered(item: ForecastMaterial): boolean {
  return item.available ?? freeStock(item) >= item.needed;
}

/** How much more free stock is needed, or 0 when there is enough. */
export function shortfall(item: ForecastMaterial): number {
  return isCovered(item) ? 0 : Math.max(item.needed - freeStock(item), 0);
}

const raw = 0;
const packaging = 1;
/** Materials split the way they are bought and issued, with those that are short listed first. */
export function forecastGroups(materials: readonly ForecastMaterial[]) {
  const shortFirst = (kind: number) => materials.filter((item) => item.kind === kind).sort((a, b) => Number(isCovered(a)) - Number(isCovered(b)));
  return {
    raw: shortFirst(raw), packaging: shortFirst(packaging),
    // Anything the server did not class as raw or packaging is still shown, not dropped.
    other: materials.filter((item) => item.kind !== raw && item.kind !== packaging),
    short: materials.filter((item) => !isCovered(item)).length,
  };
}

import type { ForecastMaterial } from "../schemas/forecast-schema";

/** Stock on hand that has not expired; only this can go into production. */
export function usableStock(item: Pick<ForecastMaterial, "onHand" | "expired">): number {
  return Math.max(item.onHand - item.expired, 0);
}

/**
 * Whether there is enough usable stock. The server's answer is used when it gives one; its rule is
 * that usable stock must be more than what is needed, so the same rule is applied when it does not.
 */
export function isCovered(item: ForecastMaterial): boolean {
  return item.available ?? usableStock(item) > item.needed;
}

/** How much more usable stock is needed, or 0 when there is enough. */
export function shortfall(item: ForecastMaterial): number {
  return isCovered(item) ? 0 : Math.max(item.needed - usableStock(item), 0);
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

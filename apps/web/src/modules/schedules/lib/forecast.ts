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

/** The substitutes listed for a main material, in the server's order. */
export function substitutesOf(main: ForecastMaterial, materials: readonly ForecastMaterial[]): ForecastMaterial[] {
  return materials.filter((item) => item.substituteFor !== null && item.substituteFor.id === main.materialId && item.kind === main.kind);
}

/** A BOM or packaging line is covered when its main material, or one of its substitutes, has enough free stock. */
export function lineCovered(main: ForecastMaterial, materials: readonly ForecastMaterial[]): boolean {
  return isCovered(main) || substitutesOf(main, materials).some(isCovered);
}

const raw = 0;
const packaging = 1;
/**
 * Materials split the way they are bought and issued. Lines that are short come first; each main material is followed
 * directly by its substitutes, so the two read together.
 */
export function forecastGroups(materials: readonly ForecastMaterial[]) {
  const mains = materials.filter((item) => item.substituteFor === null);
  const ordered = (kind: number) => mains.filter((item) => item.kind === kind)
    .sort((a, b) => Number(lineCovered(a, materials)) - Number(lineCovered(b, materials)))
    .flatMap((main) => [main, ...substitutesOf(main, materials)]);
  // A substitute whose main material was not sent is still shown, after the lines.
  const listed = new Set([...ordered(raw), ...ordered(packaging)].map((item) => item.id));
  return {
    raw: ordered(raw), packaging: ordered(packaging),
    // Anything the server did not class as raw or packaging is still shown, not dropped.
    other: materials.filter((item) => !listed.has(item.id) && (item.kind !== raw && item.kind !== packaging || item.substituteFor !== null)),
    short: mains.filter((item) => !lineCovered(item, materials)).length,
  };
}

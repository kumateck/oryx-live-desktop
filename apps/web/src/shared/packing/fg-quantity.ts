import { formatCount, packingLayout, packsFrom, pluralUnit, shipperSplit, type PackingLayout, type SavedStyle } from "./packs";

/**
 * The finished goods quantity engine.
 *
 * The backend stores every finished goods quantity as yield: the exact base units produced (tablets,
 * bottles, tubes…). People in the finished goods store never see or type yield. They count shippers
 * and loose packs, so every quantity is converted here, with the packing style of the transfer it
 * belongs to, on the way in and on the way out.
 */

/** A yield as the store counts it: full shippers, loose packs, and base units that do not fill a pack. */
export interface FgCount { shippers: number; loose: number; units: number }

/** How a packing style converts, plus the base unit's name for any units left over. */
export type FgLayout = PackingLayout;

export const emptyCount = (): FgCount => ({ shippers: 0, loose: 0, units: 0 });

/** The conversion for a packing style as the backend returns it. */
export const fgLayout = (style: SavedStyle | null | undefined): FgLayout =>
  style ? packingLayout(style) : { perShipper: null, baseUnitsPerPack: null, packName: null, baseName: null };

/** Whether a layout can turn yield into packs. Without it, quantities cannot be shown or entered as shippers and loose. */
export const canCount = (layout: FgLayout): boolean => typeof layout.baseUnitsPerPack === "number" && Number.isFinite(layout.baseUnitsPerPack) && layout.baseUnitsPerPack > 0;

// Yield is a decimal on the server; this keeps 1,000 tablets at 10 per pack from becoming 99 packs and 9.9999 tablets.
const clean = (value: number) => Math.round(value * 1e6) / 1e6;

/** Yield as shippers, loose packs and leftover base units. Null when the packing style does not say how many units fill a pack. */
export function fgCount(yieldUnits: number, layout: FgLayout): FgCount | null {
  if (!canCount(layout)) return null;
  const perPack = layout.baseUnitsPerPack as number;
  const total = Number.isFinite(yieldUnits) && yieldUnits > 0 ? yieldUnits : 0;
  const packs = Math.floor(clean(total / perPack));
  const split = shipperSplit(packs, layout.perShipper);
  return { ...split, units: clean(total - packs * perPack) };
}

/** The yield the store counted: shippers and loose packs as entered, in base units. Null when the packing style cannot convert. */
export function yieldOf(shippers: number, loose: number, layout: FgLayout): number | null {
  if (!canCount(layout)) return null;
  return clean(packsFrom(shippers, loose, layout.perShipper) * (layout.baseUnitsPerPack as number));
}

/** Adds counts that were each worked out with their own packing style. Loose packs are not merged into shippers across styles or batches. */
export const addCounts = (left: FgCount, right: FgCount): FgCount => ({ shippers: left.shippers + right.shippers, loose: left.loose + right.loose, units: clean(left.units + right.units) });

/** "212 shippers · 47 loose", with "· 7 tablets" when units are left that do not fill a pack. */
export function countText(count: FgCount, baseName?: string | null): string {
  const units = count.units > 0 ? ` · ${formatCount(count.units)} ${baseName ? (count.units === 1 ? baseName.toLowerCase() : pluralUnit(baseName).toLowerCase()) : "units"}` : "";
  return `${formatCount(count.shippers)} ${count.shippers === 1 ? "shipper" : "shippers"} · ${formatCount(count.loose)} loose${units}`;
}

/** A yield as shippers and loose, or a plain note when the packing style is incomplete. The yield itself is never shown as the count. */
export function fgText(yieldUnits: number, layout: FgLayout): string {
  const count = fgCount(yieldUnits, layout);
  return count ? countText(count, layout.baseName) : "Packing style incomplete";
}

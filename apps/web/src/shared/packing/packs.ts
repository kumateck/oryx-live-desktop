/**
 * Plain-language hints for a packing style's units. Units are listed outermost first: each row's
 * quantity counts the unit on the next row, and the last row's quantity counts base packing units.
 */

export interface UnitRow { uom?: { label?: string | null } | null; quantity?: number | null }

const count = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });

/** "Outer Carton" from "Outer Carton (Out ctn)", the way the unit pickers label a unit. */
export function unitName(label: string | null | undefined): string | null {
  const name = label?.replace(/\s*\([^)]*\)\s*$/, "").trim();
  return name || null;
}

/** Simple English plural for a unit name: Tablet → Tablets, Box → Boxes, Battery → Batteries. */
export function pluralUnit(name: string): string {
  if (/(s|x|z|ch|sh)$/i.test(name)) return `${name}es`;
  if (/[^aeiou]y$/i.test(name)) return `${name.slice(0, -1)}ies`;
  return `${name}s`;
}

const validQuantity = (quantity: number | null | undefined): quantity is number =>
  typeof quantity === "number" && Number.isFinite(quantity) && quantity > 0;

const amountOf = (quantity: number, name: string) => `${count.format(quantity)} ${quantity === 1 ? name : pluralUnit(name)}`;

/** What one of `units[index]` holds, for example "1 Shipper = 80 Outer Cartons". */
export function unitHint(units: readonly UnitRow[], index: number, baseLabel: string | null | undefined): string {
  const holder = unitName(units[index]?.uom?.label) ?? "unit";
  const isLast = index === units.length - 1;
  const contents = isLast ? unitName(baseLabel) : unitName(units[index + 1]?.uom?.label);
  const quantity = units[index]?.quantity;
  if (!validQuantity(quantity)) {
    return `1 ${holder} = how many ${contents ? pluralUnit(contents) : isLast ? "base packing units" : "of the next unit"}?`;
  }
  if (contents) return `1 ${holder} = ${amountOf(quantity, contents)}`;
  return `1 ${holder} = ${count.format(quantity)} ${isLast ? (quantity === 1 ? "base packing unit" : "base packing units") : "of the next unit"}`;
}

/** The whole hierarchy in base units, for example "1 Shipper = 80 × 20 × 10 = 16,000 Tablets". Null until every row is filled in. */
export function hierarchySummary(units: readonly UnitRow[], baseLabel: string | null | undefined): string | null {
  const outer = unitName(units[0]?.uom?.label);
  const base = unitName(baseLabel);
  if (units.length < 2 || !outer || !base) return null;
  if (!units.every((unit) => unitName(unit.uom?.label) && validQuantity(unit.quantity))) return null;
  const quantities = units.map((unit) => unit.quantity as number);
  const total = quantities.reduce((product, quantity) => product * quantity, 1);
  return `1 ${outer} = ${quantities.map((quantity) => count.format(quantity)).join(" × ")} = ${amountOf(total, base)}`;
}

/**
 * Where the pack sits in the hierarchy: the index of a unit row, or `units.length` for the base packing unit.
 * Packs per shipper multiplies the quantities from the shipper row down to the row above the pack,
 * so it can span one row or several (Shipper 80 → Outer Carton 20 → Inner Carton: 1,600 inner cartons per shipper).
 */
export function packsPerShipper(units: readonly UnitRow[], shipperIndex: number, packLevel: number): number | null {
  if (shipperIndex < 0 || packLevel <= shipperIndex || packLevel > units.length) return null;
  return multiply(units.slice(shipperIndex, packLevel));
}

/** How many base packing units one pack holds: 1 when the pack is the base unit itself. */
export function baseUnitsPerPack(units: readonly UnitRow[], packLevel: number): number | null {
  if (packLevel < 0 || packLevel > units.length) return null;
  return multiply(units.slice(packLevel));
}

/**
 * The pack level that gives `packPerShipper` packs per shipper, with the shipper as the first row.
 * Null when no level matches. When two levels match (a row with quantity 1), the outer one wins.
 */
export function matchingPackLevel(units: readonly UnitRow[], packPerShipper: number | null | undefined): number | null {
  if (!validQuantity(packPerShipper)) return null;
  for (let level = 1; level <= units.length; level += 1) {
    if (packsPerShipper(units, 0, level) === packPerShipper) return level;
  }
  return null;
}

function multiply(rows: readonly UnitRow[]): number | null {
  let total = 1;
  for (const row of rows) {
    if (!validQuantity(row.quantity)) return null;
    total *= row.quantity;
  }
  return total;
}

export const formatCount = (value: number) => count.format(value);

/** Splits a count of packs into full shippers and the loose packs left over. */
export function splitPacks(total: number, perShipper: number): { shippers: number; loose: number } | null {
  if (!Number.isFinite(total) || total < 0 || !validQuantity(perShipper)) return null;
  const shippers = Math.floor(total / perShipper);
  return { shippers, loose: total - shippers * perShipper };
}

/** A packing style as the backend returns it: units in any order, each with its `order`. */
export interface SavedStyle {
  packPerShipper?: number | null | undefined;
  packingLists?: readonly { uom?: { name?: string | null | undefined; symbol?: string | null | undefined } | null | undefined; quantity?: number | null | undefined; order?: number | null | undefined }[] | null | undefined;
  basePackingUoM?: { name?: string | null | undefined; symbol?: string | null | undefined } | null | undefined;
}

/** How a packing style counts: packs per shipper, base units (tablets, bottles…) per pack, and the names to show. */
export interface PackingLayout {
  perShipper: number | null;
  /** Null when the units do not add up to packs per shipper at any level, so base units cannot be turned into packs. */
  baseUnitsPerPack: number | null;
  packName: string | null;
  baseName: string | null;
}

/** Unit rows, outermost first, from a saved packing style. */
export function savedUnits(style: SavedStyle): UnitRow[] {
  return [...(style.packingLists ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((row) => ({ uom: { label: row.uom?.name?.trim() || row.uom?.symbol?.trim() || "" }, quantity: row.quantity ?? Number.NaN }));
}

/**
 * The shipper is the first unit and the pack is the level whose count per shipper matches packs per shipper
 * (or `packLevel` when one is chosen). Base units per pack multiplies the rows below the pack.
 */
export function packingLayout(style: SavedStyle, packLevel?: number | null): PackingLayout {
  const units = savedUnits(style);
  const perShipper = validQuantity(style.packPerShipper) ? style.packPerShipper : null;
  const baseName = unitName(style.basePackingUoM?.name) ?? unitName(style.basePackingUoM?.symbol);
  // A style with no unit breakdown packs base units directly: one base unit is one pack.
  if (units.length === 0) return { perShipper, baseUnitsPerPack: 1, packName: baseName, baseName };
  const level = packLevel ?? matchingPackLevel(units, perShipper);
  if (level === null || level < 1 || level > units.length) return { perShipper, baseUnitsPerPack: null, packName: null, baseName };
  return { perShipper, baseUnitsPerPack: baseUnitsPerPack(units, level), packName: level === units.length ? baseName : unitName(units[level]?.uom?.label), baseName };
}

/** Base units counted (tablets, bottles…) as whole packs and the base units left over that do not fill a pack. */
export function toPacks(baseUnits: number, perPack: number | null): { packs: number; leftover: number } | null {
  if (!Number.isFinite(baseUnits) || baseUnits < 0 || !validQuantity(perPack)) return null;
  const packs = Math.floor(baseUnits / perPack);
  return { packs, leftover: baseUnits - packs * perPack };
}

/** Packs as full shippers and loose packs. With no shipper size everything is loose. */
export function shipperSplit(packs: number, perShipper: number | null | undefined): { shippers: number; loose: number } {
  const total = Number.isFinite(packs) && packs > 0 ? packs : 0;
  return validQuantity(perShipper) ? { shippers: Math.floor(total / perShipper), loose: total - Math.floor(total / perShipper) * perShipper } : { shippers: 0, loose: total };
}

/** Total packs from shippers and loose packs, as orders are entered. */
export function packsFrom(shippers: number, loose: number, perShipper: number | null | undefined): number {
  return (Number.isFinite(shippers) && shippers > 0 ? shippers : 0) * (validQuantity(perShipper) ? perShipper : 0) + (Number.isFinite(loose) && loose > 0 ? loose : 0);
}

/** Finished goods are counted in shippers and loose packs: "12 shippers · 5 loose". Individual tablets do not matter there. */
export function formatShippers(split: { shippers: number; loose: number }): string {
  return `${formatCount(split.shippers)} ${split.shippers === 1 ? "shipper" : "shippers"} · ${formatCount(split.loose)} loose`;
}

/** Adds shipper splits made with different shipper sizes (several batches or packing styles of one product). */
export function addSplits(splits: readonly { shippers: number; loose: number }[]): { shippers: number; loose: number } {
  return splits.reduce((sum, split) => ({ shippers: sum.shippers + split.shippers, loose: sum.loose + split.loose }), { shippers: 0, loose: 0 });
}

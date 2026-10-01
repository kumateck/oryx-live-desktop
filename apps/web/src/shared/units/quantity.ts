// Quantities are stored in the smallest unit of their family (mg for mass, ml for volume) and
// shown in the largest unit that keeps the number at 1 or more, as in Oryx Next.

interface UnitStep { symbol: string; factor: number }

const mass: readonly UnitStep[] = [{ symbol: "mg", factor: 1 }, { symbol: "g", factor: 1_000 }, { symbol: "kg", factor: 1_000_000 }];
const volume: readonly UnitStep[] = [{ symbol: "ml", factor: 1 }, { symbol: "L", factor: 1_000 }];
const families = [mass, volume];

export interface DisplayQuantity { value: number; unit: string; text: string }

function format(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

/**
 * `value` is in `baseSymbol`. A unit outside the mass and volume families (pieces, tablets) is
 * shown unchanged. Symbols match regardless of case, so "ML" and "ml" are the same unit.
 */
export function toLargestUnit(value: number | null | undefined, baseSymbol: string | null | undefined): DisplayQuantity | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const symbol = baseSymbol?.trim() ?? "";
  const family = families.find((steps) => steps.some((step) => step.symbol.toLowerCase() === symbol.toLowerCase()));
  const base = family?.find((step) => step.symbol.toLowerCase() === symbol.toLowerCase());
  if (!family || !base) return { value, unit: symbol, text: `${format(value)}${symbol ? ` ${symbol}` : ""}` };
  const inSmallest = value * base.factor;
  const best = [...family].reverse().find((step) => Math.abs(inSmallest) >= step.factor) ?? family[0];
  if (!best) return { value, unit: symbol, text: format(value) };
  const converted = Math.round((inSmallest / best.factor) * 100) / 100;
  return { value: converted, unit: best.symbol, text: `${format(converted)} ${best.symbol}` };
}

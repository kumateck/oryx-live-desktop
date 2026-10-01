// Quantities are stored in the smallest unit of their family (mg for mass, ml for volume) and
// shown in the largest unit that keeps the number at 1 or more, as in Oryx Next.

interface UnitStep { symbol: string; factor: number }

const mass: readonly UnitStep[] = [{ symbol: "mg", factor: 1 }, { symbol: "g", factor: 1_000 }, { symbol: "kg", factor: 1_000_000 }];
const volume: readonly UnitStep[] = [{ symbol: "ml", factor: 1 }, { symbol: "L", factor: 1_000 }];
const families = [mass, volume];

export interface DisplayQuantity { value: number; unit: string; text: string }

/** How many decimals a number produced by the system is shown with, at most. */
export const calculatedDecimals = 4;

/**
 * Where a number came from decides how it is shown:
 * - "entered": typed by a person. Every digit they entered is kept; nothing is rounded away.
 * - "calculated": worked out by the system. Shown to at most four decimals.
 */
export type QuantityOrigin = "entered" | "calculated";

/** Removes binary floating-point noise (0.1 + 0.2) without rounding away real digits. */
function clean(value: number): number {
  return Number(value.toPrecision(12));
}

export function formatQuantityNumber(value: number, origin: QuantityOrigin): string {
  const exact = clean(value);
  if (origin === "entered") return new Intl.NumberFormat("en-US", { maximumFractionDigits: 12 }).format(exact);
  const smallest = 10 ** -calculatedDecimals;
  // A real amount must never be displayed as zero.
  if (exact !== 0 && Math.abs(exact) < smallest) return `${exact < 0 ? "> -" : "< "}${smallest}`;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: calculatedDecimals }).format(exact);
}

/**
 * `value` is in `baseSymbol`. A unit outside the mass and volume families (pieces, tablets) is
 * shown unchanged. Symbols match regardless of case, so "ML" and "ml" are the same unit.
 * Converting between units only moves the decimal point, so an entered value keeps all its digits.
 */
export function toLargestUnit(value: number | null | undefined, baseSymbol: string | null | undefined, origin: QuantityOrigin = "entered"): DisplayQuantity | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const symbol = baseSymbol?.trim() ?? "";
  const family = families.find((steps) => steps.some((step) => step.symbol.toLowerCase() === symbol.toLowerCase()));
  const base = family?.find((step) => step.symbol.toLowerCase() === symbol.toLowerCase());
  const show = (amount: number, unit: string): DisplayQuantity => {
    const number = formatQuantityNumber(amount, origin);
    return { value: clean(amount), unit, text: unit ? `${number} ${unit}` : number };
  };
  if (!family || !base) return show(value, symbol);
  const inSmallest = value * base.factor;
  const best = [...family].reverse().find((step) => Math.abs(inSmallest) >= step.factor) ?? family[0];
  return best ? show(inSmallest / best.factor, best.symbol) : show(value, symbol);
}

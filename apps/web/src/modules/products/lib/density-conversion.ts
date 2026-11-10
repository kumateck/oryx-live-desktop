const massToGrams = (quantity: number, unit: string): number | null => {
  switch (unit.trim().toLowerCase()) {
    case "mg": return quantity / 1_000;
    case "g": return quantity;
    case "kg": return quantity * 1_000;
    default: return null;
  }
};

const volumeToMilliliters = (quantity: number, unit: string): number | null => {
  switch (unit.trim().toLowerCase()) {
    case "ml": return quantity;
    case "l": return quantity * 1_000;
    default: return null;
  }
};

/** Converts only mass to liquid volume (or the reverse) using density in g/mL. */
export function massVolumeConversion(quantity: number, from: string, to: string, densityGramsPerMilliliter: number): number | null {
  if (!Number.isFinite(quantity) || !(densityGramsPerMilliliter > 0)) return null;
  const grams = massToGrams(quantity, from);
  if (grams !== null) {
    const milliliters = grams / densityGramsPerMilliliter;
    return to.trim().toLowerCase() === "ml" ? milliliters : to.trim().toLowerCase() === "l" ? milliliters / 1_000 : null;
  }
  const milliliters = volumeToMilliliters(quantity, from);
  if (milliliters !== null) {
    const target = to.trim().toLowerCase();
    const targetGrams = milliliters * densityGramsPerMilliliter;
    if (target === "mg") return targetGrams * 1_000;
    if (target === "g") return targetGrams;
    if (target === "kg") return targetGrams / 1_000;
  }
  return null;
}

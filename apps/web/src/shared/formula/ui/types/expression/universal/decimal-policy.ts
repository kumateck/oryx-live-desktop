export const DEFAULT_DECIMAL_PLACES = 2;
export const MAX_DECIMAL_PLACES = 12;

export function decimalPlacesOrDefault(
  value: unknown,
  fallback = DEFAULT_DECIMAL_PLACES,
): number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_DECIMAL_PLACES
    ? value
    : fallback;
}

export function roundHalfAwayFromZero(
  value: number | null,
  decimalPlaces: number,
) {
  if (value === null) return null;
  if (!Number.isFinite(value)) return value;
  const factor = 10 ** decimalPlaces;
  const rounded = Math.round((Math.abs(value) + Number.EPSILON) * factor);
  return (Math.sign(value) * rounded) / factor;
}

export const toDisplayedFormulaResult = (
  value: number | null,
  percentageResults = false,
) => {
  if (value === null) return null;
  return percentageResults ? value * 100 : value;
};

export const formatCompactFormulaResult = (
  value: number | null,
  decimalPlaces?: number | "",
  percentageResults = false,
) => {
  if (value === null || !Number.isFinite(value)) return "—";
  const digits = typeof decimalPlaces === "number" ? decimalPlaces : 2;
  const formatted = value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
  return percentageResults ? `${formatted}%` : formatted;
};

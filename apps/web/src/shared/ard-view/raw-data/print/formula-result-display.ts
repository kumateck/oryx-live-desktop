type FormulaEquationResultOptions = {
  decimalPlaces?: number | "" | undefined;
  percentageResults?: boolean | undefined;
  value: number | null | undefined;
};

export const formatFormulaEquationResult = ({
  decimalPlaces,
  percentageResults,
  value,
}: FormulaEquationResultOptions): string | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  const displayValue = percentageResults ? value * 100 : value;
  const digits = typeof decimalPlaces === "number" ? decimalPlaces : undefined;

  const formatted = displayValue.toLocaleString(undefined, {
    maximumFractionDigits: digits ?? 6,
    minimumFractionDigits: digits,
  });

  return percentageResults ? `${formatted}%` : formatted;
};

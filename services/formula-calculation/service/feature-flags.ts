export const FORMULA_V2_INTERNAL_SERVICE_FLAG =
  "FORMULA_V2_INTERNAL_SERVICE_ENABLED" as const;

export const isFormulaV2InternalServiceEnabled = (
  value: string | undefined,
): boolean => value?.trim().toLowerCase() === "true";

import { FormResponseDto } from "@/shared/ard-view/dto";

export type StoredFormulaResult = {
  key: string;
  value: string;
  unit: string | null;
};

export type GovernedFormResponse = FormResponseDto & {
  formulaGoverned?: boolean | undefined;
  formulaResultFinalized?: boolean | undefined;
  formulaExecutionId?: string | null | undefined;
  formulaDisplayResultsJson?: string | null | undefined;
};

export const parseStoredFormulaResults = (
  response?: FormResponseDto,
): StoredFormulaResult[] => {
  const json = (response as GovernedFormResponse | undefined)
    ?.formulaDisplayResultsJson;
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const value = item as Record<string, unknown>;
      if (typeof value.key !== "string" || typeof value.value !== "string") {
        return [];
      }
      return [
        {
          key: value.key,
          value: value.value,
          unit: typeof value.unit === "string" ? value.unit : null,
        },
      ];
    });
  } catch {
    return [];
  }
};

export const isGovernedFormulaResponse = (response?: FormResponseDto) =>
  Boolean(response?.formulaGoverned || response?.formulaRepairPending || response?.formulaRepairEvaluated);

/** "sample1" → "Sample 1", "average" → "Average"; labels already written for people are kept. */
export function resultLabel(key: string): string {
  const spaced = key.trim().replace(/_/g, " ").replace(/([a-z])(\d)/gi, "$1 $2").replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

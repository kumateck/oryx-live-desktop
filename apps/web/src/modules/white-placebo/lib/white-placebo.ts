import type { AccessRule } from "@/shared/auth/access";
import { toLargestUnit } from "@/shared/units/quantity";

export const path = "/production/white-placebo";
export const audit = { module: "Production Planning", subModule: "White Placebo" } as const;
/** One key per task, matching the backend's `[Authorize]` on each White Placebo endpoint. */
export const permissions = {
  view: "CanViewWhitePlacebo",
  recipe: "CanEditWhitePlaceboRecipe",
  create: "CanRequestWhitePlaceboIngredients",
  issue: "CanIssueWhitePlaceboIngredients",
  output: "CanRecordWhitePlaceboOutput",
} as const satisfies Record<string, AccessRule | string>;
export const quantity = (value: number, unit: string, calculated = false) => toLargestUnit(value, unit, calculated ? "calculated" : "entered")?.text ?? "–";

interface Standing { rejected: boolean; issuedAt: string | null; outputBatchId: string | null; approved: boolean; qualityStatus: number | null; useBy: string | null }
export function preparationStatus(item: Standing, now = new Date()): string {
  if (item.rejected) return "Request rejected";
  if (item.outputBatchId) {
    if (item.useBy && new Date(item.useBy) <= now) return "Holding period ended";
    if (item.qualityStatus === 4) return "Quality rejected";
    if (item.qualityStatus === 3) return "Available";
    if (item.qualityStatus === 8) return "Awaiting shelf allocation";
    return "Quality control";
  }
  if (item.issuedAt) return "Awaiting weighed output";
  return item.approved ? "Awaiting ingredient issue" : "Awaiting stock approval";
}

export function yieldPercent(actual: number, expected: number): number | null {
  return expected > 0 && Number.isFinite(actual) && Number.isFinite(expected) ? actual / expected * 100 : null;
}

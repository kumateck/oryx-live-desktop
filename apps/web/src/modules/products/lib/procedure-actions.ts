import type { SelectOption } from "@/shared/forms/form-wizard-types";

/** What a responsible party is asked to do at a step. The position in this list is the backend's number for it. */
const labels = [
  "BMR and BPR requisition or issue", "Stock requisition or issue", "Full return", "Additional stock request or issue",
  "Final packing and partial return", "Transfer finished products", "Dispatch", "ATR",
] as const;

export const actionOptions: readonly SelectOption[] = labels.map((label, index) => ({ value: String(index), label }));
/** The analytical test request; the only instruction that can point to analytical raw data. */
export const atrAction = "7";
/** Instructions a person must complete by hand. */
export const mainActions: readonly string[] = ["0", "1", "4", "5", "6", "7"];

export function actionLabel(action: number | string | null | undefined): string {
  return actionOptions.find((option) => option.value === String(action))?.label ?? "Unknown instruction";
}

const stages = ["Intermediate", "Bulk", "Finished"] as const;
export function ardLabel(stpNumber: string | null | undefined, stage: number | null | undefined): string {
  const name = stpNumber?.trim() || "No STP number";
  const stageName = typeof stage === "number" ? stages[stage] : undefined;
  return stageName ? `${name} (${stageName})` : name;
}

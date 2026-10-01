import { sentenceCase } from "@/shared/format/words";

const stages = ["Intermediate", "Bulk", "Finished"] as const;
export function testStageLabel(stage: number | null | undefined): string | null {
  return stage !== null && stage !== undefined ? stages[stage] ?? null : null;
}

const actions = ["BmrAndBprRequisitionOrIssue", "StockRequisitionOrIssue", "FullReturn", "AdditionalStockRequestOrIssue",
  "FinalPackingAndPartialReturn", "TransferFinishedProducts", "Dispatch", "Atr"] as const;
export function operationActionLabel(action: number | null | undefined): string | null {
  const name = action !== null && action !== undefined ? actions[action] : undefined;
  return name === "Atr" ? "Analytical test request" : name ? sentenceCase(name).replace("Bmr and bpr", "BMR and BPR") : null;
}

/**
 * Quantity of one material for a full batch: its quantity per composition unit, scaled by how many
 * composition units make a batch. Null when the composition size is missing or zero, instead of Infinity.
 */
export function batchQuantity(materialPerUnit: number | null, compositionSize: number | null, batchSize: number | null): number | null {
  if (materialPerUnit === null || batchSize === null || !compositionSize) return null;
  const value = materialPerUnit * (batchSize / compositionSize);
  return Number.isFinite(value) ? value : null;
}

/** Prescribed quantity plus the allowed excess. */
export function packageTotal(prescribed: number | null, excess: number | null): number | null {
  return prescribed === null && excess === null ? null : (prescribed ?? 0) + (excess ?? 0);
}

export const productTabs = [
  { id: "bom", label: "Active BOM" },
  { id: "outdated-boms", label: "Outdated BOMs" },
  { id: "packaging", label: "Packaging" },
  { id: "packing-styles", label: "Packing styles" },
  { id: "procedure", label: "Procedure" },
  { id: "stp", label: "Product STP" },
  { id: "specifications", label: "Specifications" },
  { id: "ard", label: "ARD" },
] as const;
export type ProductTabId = (typeof productTabs)[number]["id"];

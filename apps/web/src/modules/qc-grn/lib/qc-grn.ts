import { BatchStatus } from "@/shared/material-batches/batch-status";
export { BatchStatus, batchStatusLabels } from "@/shared/material-batches/batch-status";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

export const qcGrnPath = "/qc/goods-receipt-note";
const kindQuery = (kind: MaterialKind) => `?type=${String(kind)}`;
export const grnDetailPath = (id: string, kind: MaterialKind) => `${qcGrnPath}/${id}${kindQuery(kind)}`;
export const batchPath = (grnId: string, batchId: string, kind: MaterialKind, step: "" | "assign" | "reassign" | "test" = "") => `${qcGrnPath}/${grnId}/batches/${batchId}${step ? `/${step}` : ""}${kindQuery(kind)}`;
export const qcGrnAudit = { module: "Quality Assurance", subModule: "Analytical Raw Data" } as const;
export const grnListAudit = { module: "Warehouse", subModule: "QA GRN" } as const;

const byKind = <T extends string>(raw: T, packaging: T) => ({ 0: raw, 1: packaging }) as Record<MaterialKind, T>;
/** Every QC action on a received batch has its own permission for raw and for packaging material. */
export const qcPermissions = {
  view: byKind("CanViewRawMaterialGoodsReceiptNotes", "CanViewPackagingMaterialGoodsReceiptNotes"),
  sample: byKind("CanTakeRawMaterialSample", "CanTakePackagingMaterialSample"),
  test: byKind("CanStartRawMaterialTest", "CanStartPackagingMaterialTest"),
  reassign: byKind("CanReassignRawMaterialTest", "CanReassignPackagingMaterialTest"),
  check: byKind("CanCheckRawMaterialTestResult", "CanCheckPackagingMaterialTestResult"),
  requestRetest: byKind("CanRequestRetestRawMaterial", "CanRequestRetestPackagingMaterial"),
  completeRetest: byKind("CanCompleteRetestRawMaterial", "CanCompleteRetestPackagingMaterial"),
} as const;

export const grnStatusLabels: Record<number, string> = { 0: "Pending", 1: "Partly done", 2: "Completed" };

export type BatchAction = "sample" | "assign" | "start" | "continue" | "reassign" | "assignments" | "check" | "requestRetest" | "completeRetest" | "print";
/** What can be done with a batch in its status, in the order QC does it. */
export function batchActions(status: number | null): ReadonlySet<BatchAction> {
  const S = BatchStatus;
  const actions = new Set<BatchAction>();
  if (status === S.Quarantine) actions.add("sample");
  if (status === S.Sampled) actions.add("assign");
  if (status === S.TestAssigned) { actions.add("start"); actions.add("reassign"); }
  if (status === S.Testing) { actions.add("continue"); actions.add("reassign"); }
  if (status === S.TestAssigned || status === S.Testing || status === S.TestTaken) actions.add("assignments");
  if (status === S.TestTaken) actions.add("check");
  if (status === S.Available || status === S.Approved || status === S.Rejected) actions.add("requestRetest");
  if (status === S.Retest) actions.add("completeRetest");
  if (status === S.TestAssigned || status === S.Testing || status === S.TestTaken || status === S.Checked || status === S.Approved) actions.add("print");
  return actions;
}
/** Once results are in, the worksheet prints with them; before that it prints blank for the bench. */
export const printsFilled = (status: number | null) => status === BatchStatus.TestTaken || status === BatchStatus.Checked || status === BatchStatus.Approved;

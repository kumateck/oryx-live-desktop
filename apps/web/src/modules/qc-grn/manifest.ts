import type { ModuleManifest } from "../contract";

const either = (raw: string, packaging: string) => ({ kind: "some" as const, permissions: [raw, packaging] });
// Quality control's side of goods received notes: sampling each batch, assigning and running its test, checking results, and retests.
export const manifest = {
  id: "qc-grn", label: "Goods receipt notes (QC)", root: "/qc/goods-receipt-note", order: 72,
  access: either("CanViewRawMaterialGoodsReceiptNotes", "CanViewPackagingMaterialGoodsReceiptNotes"),
  query: { key: "type", choices: [
    { value: "0", access: { kind: "all", permissions: ["CanViewRawMaterialGoodsReceiptNotes"] } },
    { value: "1", access: { kind: "all", permissions: ["CanViewPackagingMaterialGoodsReceiptNotes"] } },
  ] },
  routes: [
    { pattern: "/qc/goods-receipt-note/:id", access: either("CanViewRawMaterialGoodsReceiptNotes", "CanViewPackagingMaterialGoodsReceiptNotes") },
    { pattern: "/qc/goods-receipt-note/:id/batches/:batchId", access: either("CanCheckRawMaterialTestResult", "CanCheckPackagingMaterialTestResult") },
    { pattern: "/qc/goods-receipt-note/:id/batches/:batchId/assign", access: either("CanStartRawMaterialTest", "CanStartPackagingMaterialTest") },
    { pattern: "/qc/goods-receipt-note/:id/batches/:batchId/reassign", access: either("CanReassignRawMaterialTest", "CanReassignPackagingMaterialTest") },
    { pattern: "/qc/goods-receipt-note/:id/batches/:batchId/test", access: either("CanStartRawMaterialTest", "CanStartPackagingMaterialTest") },
  ],
} satisfies ModuleManifest<"qc-grn", "/qc/goods-receipt-note">;

import type { ModuleManifest } from "../contract";

const view = ["CanViewRawMaterialTransferList", "CanViewPackagingMaterialTransferList", "CanIssueRawMaterialStockTransfers", "CanIssuePackagingMaterialStockTransfers"];
export const manifest = {
  id: "stock-transfers",
  label: "Stock transfers",
  root: "/warehouse/stock-transfer-requests",
  order: 62,
  access: { kind: "some", permissions: view },
  routes: [
    // The allocation page has independently permitted raw and packaging tabs.
    { pattern: "/warehouse/stock-transfer-requests/allocation", access: { kind: "some", permissions: ["CanViewRawMaterialTransferList", "CanViewPackagingMaterialTransferList"] } },
  ],
} satisfies ModuleManifest<"stock-transfers", "/warehouse/stock-transfer-requests">;

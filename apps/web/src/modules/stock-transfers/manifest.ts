import type { ModuleManifest } from "../contract";

const view = ["CanViewRawMaterialTransferList", "CanViewPackagingMaterialTransferList", "CanIssueRawMaterialStockTransfers", "CanIssuePackagingMaterialStockTransfers"];
export const manifest = {
  id: "stock-transfers",
  label: "Stock transfers",
  root: "/warehouse/stock-transfer-requests",
  order: 62,
  access: { kind: "some", permissions: view },
} satisfies ModuleManifest<"stock-transfers", "/warehouse/stock-transfer-requests">;

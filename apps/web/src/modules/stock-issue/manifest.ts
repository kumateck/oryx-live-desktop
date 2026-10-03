import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "stock-issue",
  label: "Issue stock requisitions",
  root: "/warehouse/stock-requisition",
  order: 60,
  access: { kind: "some", permissions: ["CanViewRawMaterialRequisitions", "CanViewPackagingMaterialRequisitions", "CanIssueRawMaterialRequisitions", "CanIssuePackagingMaterialRequisitions"] },
} satisfies ModuleManifest<"stock-issue", "/warehouse/stock-requisition">;

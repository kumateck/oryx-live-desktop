import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "sourcing",
  label: "Purchase requisitions",
  root: "/procurement/requisition",
  order: 44,
  access: { kind: "all", permissions: ["CanViewPurchaseRequisitions"] },
} satisfies ModuleManifest<"sourcing", "/procurement/requisition">;

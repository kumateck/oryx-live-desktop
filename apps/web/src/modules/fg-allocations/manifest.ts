import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "fg-allocations",
  label: "Packing lists and allocations",
  root: "/crm/allocations",
  order: 95,
  access: { kind: "some", permissions: ["CanViewPackingList", "CanViewInvoice"] },
} satisfies ModuleManifest<"fg-allocations", "/crm/allocations">;

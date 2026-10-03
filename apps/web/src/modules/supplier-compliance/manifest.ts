import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "supplier-compliance", label: "Supplier compliance", root: "/procurement/supplier-compliance", order: 42,
  access: { kind: "all", permissions: ["CanViewSupplierCertifications"] },
} satisfies ModuleManifest<"supplier-compliance", "/procurement/supplier-compliance">;

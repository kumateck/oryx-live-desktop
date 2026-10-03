import type { ModuleManifest } from "../contract";

const view = { kind: "all", permissions: ["CanViewVendors"] } as const;

export const manifest = {
  id: "suppliers",
  label: "Suppliers",
  root: "/settings/suppliers",
  order: 41,
  access: view,
  routes: [
    { pattern: "/settings/suppliers/create", access: { kind: "all", permissions: ["CanCreateVendor"] } },
    { pattern: "/settings/suppliers/:id/edit", access: { kind: "all", permissions: ["CanUpdateVendorDetails"] } },
    { pattern: "/settings/suppliers/:id/relationship", access: { kind: "some", permissions: ["CanViewSupplierCertifications", "CanManageSupplierContracts", "CanViewSupplierPerformance", "CanViewSupplierSpend"] } },
  ],
} satisfies ModuleManifest<"suppliers", "/settings/suppliers">;

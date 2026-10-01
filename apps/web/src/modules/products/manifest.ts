import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "products",
  label: "Planned products",
  root: "/production/products",
  order: 40,
  // Oryx Next shows planned products only to production departments.
  access: { kind: "all", permissions: ["CanViewPlannedProducts"], departmentType: 0 },
} satisfies ModuleManifest<"products", "/production/products">;

import type { ModuleManifest } from "../contract";

const all = (...permissions: string[]) => ({ kind: "all" as const, permissions });
// Product specifications by test stage (intermediate, bulk, finished): the template a product is tested on and each test's reference.
export const manifest = {
  id: "product-specifications", label: "Product specifications", root: "/qc/product-specification", order: 74,
  access: all("CanViewProductSpecifications"),
  routes: [
    { pattern: "/qc/product-specification/create", access: all("CanCreateProductSpecification") },
    { pattern: "/qc/product-specification/:id/details", access: all("CanViewProductSpecifications") },
    { pattern: "/qc/product-specification/:id/edit", access: all("CanEditProductSpecification") },
    { pattern: "/qc/product-specification/:id/complete", access: { kind: "some", permissions: ["CanCreateProductSpecification", "CanEditProductSpecification"] } },
  ],
} satisfies ModuleManifest<"product-specifications", "/qc/product-specification">;

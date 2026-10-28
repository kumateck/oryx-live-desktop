import type { ModuleManifest } from "../contract";

const all = (...permissions: string[]) => ({ kind: "all" as const, permissions });
// Product standard test procedures and their controlled Word documents.
export const manifest = {
  id: "product-stps", label: "Product STPs", root: "/qc/products-stp", order: 76,
  access: all("CanViewProductStps"),
  routes: [
    { pattern: "/qc/products-stp/:id", access: all("CanViewProductStps") },
    { pattern: "/qc/products-stp/:id/document", access: all("CanViewProductStps") },
  ],
} satisfies ModuleManifest<"product-stps", "/qc/products-stp">;

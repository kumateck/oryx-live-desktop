import type { ModuleManifest } from "../contract";

const all = (...permissions: string[]) => ({ kind: "all" as const, permissions });
// Product analytical raw data by test stage: the worksheet template each product stage is tested on.
export const manifest = {
  id: "product-ards", label: "Product analytical raw data", root: "/qc/product-analytical-raw-data", order: 78,
  access: all("CanViewProductArds"),
  routes: [{ pattern: "/qc/product-analytical-raw-data/:id", access: all("CanViewProductArds") }],
} satisfies ModuleManifest<"product-ards", "/qc/product-analytical-raw-data">;

import { anyChangeKeys } from "../products/lib/product-keys";
import type { ModuleManifest } from "../contract";
export const manifest = { id: "qa-products", label: "Products", root: "/qa/products", order: 70,
  access: { kind: "all", permissions: ["CanViewQaProducts"] },
  // The edit area serves every section: any QA section change key opens it, and each section checks its own keys.
  routes: [{ pattern: "/qa/products/:id/edit/:tab", access: { kind: "some", permissions: anyChangeKeys("qa") } }],
} satisfies ModuleManifest<"qa-products", "/qa/products">;

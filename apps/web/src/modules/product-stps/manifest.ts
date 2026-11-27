import type { ModuleManifest } from "../contract";
import { revisionKeys as r } from "./lib/product-stp-revisions";

const all = (...permissions: string[]) => ({ kind: "all" as const, permissions });
// Product standard test procedures, their controlled Word documents and their structured revisions.
export const manifest = {
  id: "product-stps", label: "Product STPs", root: "/qc/products-stp", order: 76,
  access: all("CanViewProductStps"),
  routes: [
    { pattern: "/qc/products-stp/:id", access: all("CanViewProductStps") },
    { pattern: "/qc/products-stp/:id/document", access: all("CanViewProductStps") },
    { pattern: "/qc/products-stp/revisions", access: all(r.view) },
    { pattern: "/qc/products-stp/revisions/new", access: all(r.view, r.create) },
    { pattern: "/qc/products-stp/revisions/import", access: all(r.view, r.import) },
    { pattern: "/qc/products-stp/revisions/:id", access: all(r.view) },
    { pattern: "/qc/products-stp/revisions/:id/draft", access: all(r.view, r.editDraft) },
    { pattern: "/qc/products-stp/revisions/:id/edit", access: all(r.view, r.edit) },
  ],
} satisfies ModuleManifest<"product-stps", "/qc/products-stp">;

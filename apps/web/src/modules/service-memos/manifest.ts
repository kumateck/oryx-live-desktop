import type { ModuleManifest } from "../contract";
// Service procurement after a job order goes out: quotations, comparison, proforma invoices and memos. Pages live in service-procurement.
export const manifest = {
  id: "service-memos", label: "Service memos", root: "/extrals/service-memo", order: 161,
  access: { kind: "some", permissions: ["CanViewServicesMemo"] },
  routes: [{ pattern: "/extrals/service-memo/:id", access: { kind: "some", permissions: ["CanViewServicesMemo"] } }],
} satisfies ModuleManifest<"service-memos", "/extrals/service-memo">;

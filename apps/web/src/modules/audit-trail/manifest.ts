import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "audit-trail",
  label: "Audit trail",
  root: "/access-management/audit-trail",
  order: 22,
  access: { kind: "all", permissions: ["CanViewAuditTrail"] },
} satisfies ModuleManifest<"audit-trail", "/access-management/audit-trail">;

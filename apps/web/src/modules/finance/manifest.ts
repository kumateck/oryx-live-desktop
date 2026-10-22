import type { ModuleManifest } from "../contract";
import { financePermissions as p } from "./lib/access";
export const manifest = {
  id: "finance", label: "Finance", root: "/finance", order: 10,
  access: { kind: "some", permissions: [p.view, p.approve, p.reports] }, routes: [
    { pattern: "/finance/payments", access: { kind: "all", permissions: [p.view] } },
    { pattern: "/finance/payments/:id", access: { kind: "all", permissions: [p.view] } },
    { pattern: "/finance/payment-approvals", access: { kind: "all", permissions: [p.approve] } },
    { pattern: "/finance/payment-approvals/:id", access: { kind: "all", permissions: [p.approve] } },
    { pattern: "/finance/cashflow", access: { kind: "all", permissions: [p.reports] } },
  ],
} satisfies ModuleManifest<"finance", "/finance">;

import type { ModuleManifest } from "../contract";
export const manifest = { id: "approval-settings", label: "Approval workflows", root: "/settings/approvals", order: 81,
  access: { kind: "all", permissions: ["CanViewApprovals"] }, routes: [
    { pattern: "/settings/approvals/create", access: { kind: "all", permissions: ["CanCreateNewApproval"] } },
    { pattern: "/settings/approvals/edit/:id", access: { kind: "all", permissions: ["CanEditApprovalWorkflow"] } },
  ],
} satisfies ModuleManifest<"approval-settings", "/settings/approvals">;

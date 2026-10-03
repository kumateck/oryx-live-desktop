import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "pending-approvals",
  label: "My pending approvals",
  root: "/qa/pending-approvals",
  order: 20,
  access: { kind: "all", permissions: ["CanViewPendingApprovals"] },
} satisfies ModuleManifest<"pending-approvals", "/qa/pending-approvals">;

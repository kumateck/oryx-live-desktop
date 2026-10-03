import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "approval-rights-transfer",
  label: "Transfer approval rights",
  root: "/qa/approval-rights-transfer",
  order: 21,
  access: { kind: "all", permissions: ["CanTransferApprovalRights"] },
} satisfies ModuleManifest<"approval-rights-transfer", "/qa/approval-rights-transfer">;

import type { ModuleManifest } from "../contract";
// QA's approval of reviewed formula revisions. Its pages are the formula-reviews module's queue and detail in approval mode.
export const manifest = { id: "formula-approvals", label: "Formula Approvals", root: "/qa/formula-approvals", order: 73,
  access: { kind: "all", permissions: ["CanViewApproveFormulaRevision"] },
} satisfies ModuleManifest<"formula-approvals", "/qa/formula-approvals">;

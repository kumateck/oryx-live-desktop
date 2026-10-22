import type { ModuleManifest } from "../contract";
// QA's independent review of submitted formula revisions. Reviewers read revisions through their own permission,
// so they need no right to edit questions. The approval queue is the formula-approvals module.
export const manifest = { id: "formula-reviews", label: "Formula Reviews", root: "/qa/formula-reviews", order: 72,
  access: { kind: "all", permissions: ["CanViewReviewFormulaRevision"] },
} satisfies ModuleManifest<"formula-reviews", "/qa/formula-reviews">;

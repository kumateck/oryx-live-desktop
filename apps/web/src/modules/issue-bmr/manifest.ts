import type { ModuleManifest } from "../contract";
// QA issues the batch manufacturing and packaging records production has requested.
export const manifest = { id: "issue-bmr", label: "Issue BMR/BPR", root: "/qa/issue-bmr", order: 71,
  access: { kind: "some", permissions: ["CanViewIssuedBmrBprs", "CanIssueBmr"] },
} satisfies ModuleManifest<"issue-bmr", "/qa/issue-bmr">;

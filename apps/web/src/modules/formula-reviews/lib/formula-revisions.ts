import { formulaRevisionPermissions, type RevisionStage } from "@/shared/formula/review/revision-review";

export const formulaRevisionAudit = { module: "QualityAssurance", subModule: "Formula" } as const;

export const stageConfig = {
  review: { path: "/qa/formula-reviews", title: "Formula reviews", detailTitle: "Formula review", view: formulaRevisionPermissions.viewReview,
    description: "Submitted formula revisions waiting for an independent review.", empty: "No revisions are waiting for review" },
  approval: { path: "/qa/formula-approvals", title: "Formula approvals", detailTitle: "Formula approval", view: formulaRevisionPermissions.viewApproval,
    description: "Reviewed formula revisions waiting for approval before they can be used.", empty: "No revisions are waiting for approval" },
} as const satisfies Record<RevisionStage, unknown>;

/** A revision's page in a queue. The revision is named so the page shows exactly the one that was opened. */
export const revisionDetailPath = (stage: RevisionStage, questionId: string, revisionId?: string | null) =>
  `${stageConfig[stage].path}/${encodeURIComponent(questionId)}${revisionId ? `?revisionId=${encodeURIComponent(revisionId)}` : ""}`;

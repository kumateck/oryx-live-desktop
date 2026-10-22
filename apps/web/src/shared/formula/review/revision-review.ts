import { FormulaRevisionStatus, type FormulaRevision } from "../governance-api";

/** The two independent decisions a submitted formula revision needs before it can be used. */
export type RevisionStage = "review" | "approval";

export const formulaRevisionPermissions = {
  viewReview: "CanViewReviewFormulaRevision", review: "CanReviewFormulaRevision",
  viewApproval: "CanViewApproveFormulaRevision", approve: "CanApproveFormulaRevision",
} as const;

/** The permission that records the decision of a stage. */
export const decisionPermission = (stage: RevisionStage) => stage === "review" ? formulaRevisionPermissions.review : formulaRevisionPermissions.approve;

const same = (left: string | null | undefined, right: string | null | undefined) => Boolean(left && right && left.toLowerCase() === right.toLowerCase());

/** Which decision the revision is waiting for, or null when it is not in review. */
export function awaitingStage(revision: Pick<FormulaRevision, "status" | "reviewedById">): RevisionStage | null {
  if (revision.status !== FormulaRevisionStatus.InReview) return null;
  return revision.reviewedById ? "approval" : "review";
}

/** Where the revision stands, in words. */
export function revisionStandingText(revision: Pick<FormulaRevision, "status" | "reviewedById">): string {
  switch (revision.status) {
    case FormulaRevisionStatus.Draft: return "Draft. The author has not submitted it for review.";
    case FormulaRevisionStatus.InReview: return revision.reviewedById ? "Reviewed. Waiting for approval." : "Submitted. Waiting for an independent review.";
    case FormulaRevisionStatus.Approved: return "Approved. This is the formula in use.";
    default: return "Retired. A later approved revision replaced it.";
  }
}

/**
 * Why the user cannot record this stage's decision on the revision, or null when they can.
 * Mirrors the server's rules: the author never reviews, and neither the author nor the reviewer approves.
 */
export function decisionProblem(revision: Pick<FormulaRevision, "status" | "reviewedById" | "createdById">, stage: RevisionStage, userId: string | null | undefined): string | null {
  const awaiting = awaitingStage(revision);
  if (awaiting !== stage) {
    if (stage === "review" && awaiting === "approval") return "This revision has already been reviewed. It is waiting for approval.";
    if (stage === "approval" && awaiting === "review") return "This revision has not been reviewed yet. It must be reviewed before it can be approved.";
    return `This revision is not waiting for ${stage === "review" ? "a review" : "approval"}. ${revisionStandingText(revision)}`;
  }
  if (same(revision.createdById, userId)) return `You wrote this revision. Someone else must ${stage === "review" ? "review" : "approve"} it.`;
  if (stage === "approval" && same(revision.reviewedById, userId)) return "You reviewed this revision. Someone else must approve it.";
  return null;
}

/** True when nothing a decision depends on changed between reading the revision and deciding. */
export function sameDecisionEvidence(read: FormulaRevision, fresh: FormulaRevision): boolean {
  return read.id === fresh.id && read.definitionHash === fresh.definitionHash && read.status === fresh.status
    && (read.reviewedById ?? null) === (fresh.reviewedById ?? null) && (read.approvedById ?? null) === (fresh.approvedById ?? null);
}

/**
 * The revision to show: the one the link names, otherwise the one waiting for this stage, otherwise the newest.
 * A named revision that is not returned is reported as missing rather than replaced by another one.
 */
export function selectRevision(revisions: readonly FormulaRevision[], revisionId: string | null, stage: RevisionStage): { revision: FormulaRevision | null; missing: boolean } {
  if (revisionId) { const named = revisions.find((item) => same(item.id, revisionId)); return { revision: named ?? null, missing: !named }; }
  return { revision: revisions.find((item) => awaitingStage(item) === stage) ?? revisions[0] ?? null, missing: false };
}

/** Who did a step, relative to the signed-in user. The server does not return names with a revision. */
export function actorText(actorId: string | null | undefined, userId: string | null | undefined): string {
  if (!actorId) return "Not recorded";
  return same(actorId, userId) ? "You" : "Another user";
}

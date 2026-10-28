import { useRef } from "react";
import { approvalsApi } from "@/shared/api/generated/approvals";
import { readAllPages } from "@/shared/api/read-all-pages";
import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { sessionUserId } from "@/shared/auth/session-api";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { performanceApi } from "@/shared/performance/api";
import { performanceAudit, ReviewStatus, type Review } from "@/shared/performance/contracts";
import { reviewDecisionProblem } from "../lib/rules";
export function useReviewDecision(original: Review, action: "approve" | "reject") {
  const gate = usePermissionAction({
    kind: "all",
    permissions: ["CanApprovePerformanceReview", "CanViewPerformanceReviews", ...(action === "approve" ? ["CanViewTeamGoals", "CanViewOwnGoals"] : [])],
  });
  const user = useCurrentUser();
  const userId = useRef(user?.id);
  userId.current = user?.id;
  const running = useRef(false);
  const dispatch = useApiDispatch();
  const [read] = performanceApi.useLazyPerformanceReviewQuery();
  const [goals] = performanceApi.useLazyPerformanceGoalsQuery();
  const [assigned] = approvalsApi.useLazyGetApiV1ApprovalMyPendingByModelTypeAndModelIdQuery();
  const [approve] = approvalsApi.usePostApiV1ApprovalApproveByModelTypeAndModelIdMutation();
  const [reject] = approvalsApi.usePostApiV1ApprovalRejectByModelTypeAndModelIdMutation();
  return async (comments: string): Promise<string | null> => {
    if (running.current) return "A review decision is already running.";
    const denied = gate.check();
    if (denied) return denied;
    if (comments.trim().length > 2000 || (action === "reject" && comments.trim().length < 3)) return "Enter a rejection reason of 3 to 2,000 characters.";
    const actor = userId.current;
    if (!actor) return "Sign in before deciding this review.";
    running.current = true;
    try {
      const fresh = await read(original.id, false).unwrap();
      if (JSON.stringify(fresh) !== JSON.stringify(original) || fresh.status !== ReviewStatus.PendingApproval || fresh.approved)
        return "This review changed or is no longer awaiting approval. Refresh before continuing.";
      if (action === "approve") {
        const rows = await readAllPages(
          (page) => goals({ employeeId: fresh.employeeId, cycleId: fresh.cycleId, page, pageSize: 100 }, false).unwrap(),
          (r) => r.id,
          new AbortController().signal,
        );
        const problem = reviewDecisionProblem(original, fresh, rows);
        if (problem) return problem;
      }
      const pending = await assigned({ ...performanceAudit, modelType: "PerformanceReview", modelId: original.id }, false).unwrap();
      if (pending.id !== original.id || pending.modelType !== "PerformanceReview" || !pending.requestedBy?.id)
        return "The active approval assignment could not be verified.";
      if (pending.requestedBy.id === actor) return "The person submitting the review cannot decide their own request.";
      const revoked = gate.check();
      if (revoked) return revoked;
      if (sessionUserId() !== actor) return "The signed-in account changed. Reopen the review before deciding.";
      const decide = action === "approve" ? approve : reject;
      const result = await decide({
        ...performanceAudit,
        modelType: "PerformanceReview",
        modelId: original.id,
        domainEntitiesApprovalsApprovalRequestBody: { comments: comments.trim() },
      });
      if ("error" in result) return apiErrorMessage(result.error);
      dispatch(performanceApi.util.invalidateTags([{ type: "HrPerformance", id: "LIST" }]));
      return null;
    } catch {
      return "The review decision was not confirmed. Refresh the review and its approval history before trying again.";
    } finally {
      running.current = false;
    }
  };
}

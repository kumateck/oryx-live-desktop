import { useRef } from "react";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { financeApi, financeQueueApi, type Payment } from "../api/finance-api";
import { financeAudit, financePermissions } from "../lib/access";
import { paymentReviewProblem, samePaymentEvidence, PaymentStatus } from "../lib/payments";
export function usePaymentReview(payment: Payment) {
  const user = useCurrentUser(); const gate = usePermissionAction(financePermissions.approve);
  const currentUser = useRef(user?.id ?? null); currentUser.current = user?.id ?? null;
  const running = useRef(false);
  const [read] = financeApi.useLazyGetApiV1PaymentsByPaymentIdApprovalDetailsQuery();
  const [queue] = financeQueueApi.useLazyGetApiV1ApprovalMyPendingQuery();
  const [review] = financeApi.usePostApiV1PaymentsByPaymentIdReviewMutation();
  const decide = async (status: PaymentStatus.Approved | PaymentStatus.Rejected, comments: string, evidence: Payment): Promise<string | null> => {
    if (running.current) return "A decision is already being sent.";
    const denied = gate.check() ?? paymentReviewProblem(evidence, currentUser.current); if (denied) return denied;
    if (!evidence.id) return "Payment identity is missing.";
    const actor = currentUser.current;
    running.current = true;
    try {
      const [fresh, pending] = await Promise.all([
        read({ ...financeAudit, subModule: "Payment approval", paymentId: evidence.id }, false),
        queue({ ...financeAudit, subModule: "Payment approval", modelType: "Payment" }, false),
      ]);
      if ("error" in fresh) return apiErrorMessage(fresh.error);
      if ("error" in pending) return apiErrorMessage(pending.error);
      if (!pending.data?.some((entry) => entry.id === evidence.id && entry.modelType === "Payment")) return "This payment is no longer assigned to you. Refresh the approval queue.";
      if (!fresh.data) return "The current payment could not be verified.";
      const blocked = paymentReviewProblem(fresh.data, currentUser.current); if (blocked) return blocked;
      if (!samePaymentEvidence(evidence, fresh.data)) return "The payment or approval stage changed. Close the confirmation and review the refreshed record.";
      if (actor !== currentUser.current) return "Your session changed. Refresh the payment before reviewing.";
      const revoked = gate.check(); if (revoked) return revoked;
      const result = await review({ ...financeAudit, subModule: "Payment approval", paymentId: evidence.id, domainEntitiesPaymentsReviewPaymentRequest: { status, comments } });
      if ("error" in result) { void read({ ...financeAudit, paymentId: evidence.id }, false); return apiErrorMessage(result.error); }
      return null;
    } finally { running.current = false; }
  };
  return { decide, allowed: gate.allowed, blocked: paymentReviewProblem(payment, user?.id ?? null) };
}

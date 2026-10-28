import { useVerifiedMutation } from "@/shared/workflows/use-verified-mutation";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { decisionEvidenceApi, type DecisionEvidence } from "../api/decision-evidence";
import { approvalApi } from "../api/approval-api";
import { audit, decidedElsewhere, decisionPermission, decisionViewPermission, isReadable, type Decision } from "../lib/approval-documents";
import { approvalSchema, type PendingApproval } from "../schemas/approval-schema";

export function useApprovalDecision(approval: PendingApproval, decision: Decision, evidence: DecisionEvidence) {
  const guard = useVerifiedMutation<{ approval: PendingApproval; evidence: DecisionEvidence }>({ kind: "all", permissions: [decisionPermission(approval.type, decision), decisionViewPermission(approval.type)] }, { approval, evidence });
  const [read] = approvalApi.useLazyGetApiV1ApprovalMyPendingByModelTypeAndModelIdQuery();
  const [readEvidence] = decisionEvidenceApi.useLazyDecisionEvidenceQuery();
  const [approve] = approvalApi.usePostApiV1ApprovalApproveByModelTypeAndModelIdMutation();
  const [reject] = approvalApi.usePostApiV1ApprovalRejectByModelTypeAndModelIdMutation();
  const submit = async (comments: string, outcome: 0 | 1 | null) => {
    const type = approval.type;
    if (!isReadable(type) || decidedElsewhere(type)) return "This document must be decided in its dedicated workflow.";
    if (type === "Response" && decision === "reject" && outcome === null) return "Choose rework testing or disposal.";
    return guard.run({ approval, evidence }, async () => {
      const [record, currentEvidence] = await Promise.all([
        read({ ...audit, modelType: type, modelId: approval.id }, false).unwrap(),
        readEvidence({ type, id: approval.id, supplierId: approval.supplierId }, false).unwrap(),
      ]);
      const current = approvalSchema.parse(record);
      if (!current || current.id !== approval.id || current.type !== type) throw new Error("This request is no longer assigned to you.");
      return { approval: current, evidence: currentEvidence };
    }, async () => {
      const arg = { ...audit, modelType: type, modelId: approval.id, domainEntitiesApprovalsApprovalRequestBody: {
        comments: comments.trim() || null, ...(type === "Response" && decision === "reject" && outcome !== null ? { responseRejectionOutcome: outcome } : {}),
      } };
      const result = decision === "reject" ? await reject(arg) : await approve(arg);
      if ("error" in result) throw new Error(apiErrorMessage(result.error));
    });
  };
  return { ...guard, submit };
}

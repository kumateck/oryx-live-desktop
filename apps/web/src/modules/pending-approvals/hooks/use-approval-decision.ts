import { z } from "zod";
import { isProductionStockDocument, stockRejectionKind } from "../lib/stock-rejection";
import { useVerifiedMutation } from "@/shared/workflows/use-verified-mutation";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { decisionEvidenceApi, type DecisionEvidence } from "../api/decision-evidence";
import { approvalApi } from "../api/approval-api";
import { audit, decidedElsewhere, decisionPermission, decisionViewPermission, isReadable, type Decision } from "../lib/approval-documents";
import { approvalSchema, type PendingApproval } from "../schemas/approval-schema";

export function useApprovalDecision(approval: PendingApproval, decision: Decision, evidence: DecisionEvidence) {
  const stockKind = stockRejectionKind(evidence);
  const guard = useVerifiedMutation<{ approval: PendingApproval; evidence: DecisionEvidence }>({ kind: "all", permissions: [decisionPermission(approval.type, decision, stockKind), decisionViewPermission(approval.type)] }, { approval, evidence });
  const [read] = approvalApi.useLazyGetApiV1ApprovalMyPendingByModelTypeAndModelIdQuery();
  const [readEvidence] = decisionEvidenceApi.useLazyDecisionEvidenceQuery();
  const [rejectRawStock] = approvalApi.useRejectProductionRawStockRequisitionMutation();
  const [rejectPackagingStock] = approvalApi.useRejectProductionPackagingStockRequisitionMutation();
  const [approve] = approvalApi.usePostApiV1ApprovalApproveByModelTypeAndModelIdMutation();
  const [reject] = approvalApi.usePostApiV1ApprovalRejectByModelTypeAndModelIdMutation();
  const submit = async (comments: string, outcome: 0 | 1 | null) => {
    const type = approval.type;
    if (isProductionStockDocument(type) && decision === "reject" && stockKind === null) return "The stock requisition's material kind could not be verified. Reload its details.";
    if (isProductionStockDocument(type) && decision === "reject" && comments.trim().length > 1000) return "Keep the stock rejection reason under 1000 characters.";
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
    }, async fresh => {
      const responseEvidence = type === "Response" ? fresh.evidence.entries.find(entry => entry.url === `/api/v1/form/responses/${encodeURIComponent(approval.id)}`) : null;
      const reporting = z.object({ coaReportingToken: z.string().nullish() }).safeParse(responseEvidence?.data);
      const reportingToken = reporting.success ? reporting.data.coaReportingToken : null;
      const arg = { ...audit, modelType: type, modelId: approval.id, ...(decision === "approve" && reportingToken ? { "If-Match": `"${reportingToken}"` } : {}), domainEntitiesApprovalsApprovalRequestBody: {
        ...(type === "StockRequisition" || type === "Response" ? { contentRevision: approval.contentRevision ?? 0 } : {}),
        comments: comments.trim() || null, ...(type === "Response" && decision === "reject" && outcome !== null ? { responseRejectionOutcome: outcome } : {}),
      } };
      if (decision === "reject" && isProductionStockDocument(type) && stockKind !== null) {
        const request = { ...audit, requisitionId: approval.id, appServicesApprovalsRejectProductionStockRequisitionRequest: { reason: comments.trim(), contentRevision: approval.contentRevision ?? 0 } };
        const result = stockKind === 0 ? await rejectRawStock(request) : await rejectPackagingStock(request);
        if ("error" in result) throw new Error(apiErrorMessage(result.error));
        return;
      }
      const result = decision === "reject" ? await reject(arg) : await approve(arg);
      if ("error" in result) throw new Error(apiErrorMessage(result.error));
    });
  };
  return { ...guard, submit };
}

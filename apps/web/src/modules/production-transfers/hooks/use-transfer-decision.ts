import { useRef } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { productionTransfersApi } from "../api/transfers-api";
import { decisionProblem, sameDecisionEvidence, transferAudit, transferPermissions, transferSchema, type Transfer } from "../lib/transfers";

export function useTransferDecision() {
  const departmentId = useCurrentUser()?.departmentId ?? null;
  const currentDepartment = useRef(departmentId);
  currentDepartment.current = departmentId;
  const approvePermission = usePermissionAction({ kind: "all", permissions: [transferPermissions.incoming, transferPermissions.decide] });
  const rejectPermission = usePermissionAction({ kind: "all", permissions: [transferPermissions.incoming, transferPermissions.reject] });
  const [read] = productionTransfersApi.useLazyGetApiV1ProductionScheduleStockTransferByStockTransferIdQuery();
  const [approve] = productionTransfersApi.usePutApiV1ProductionScheduleStockTransferApproveByStockTransferIdMutation();
  const [reject] = productionTransfersApi.usePutApiV1ProductionScheduleStockTransferRejectByStockTransferIdMutation();
  const running = useRef(false);
  const decide = async (transfer: Transfer, decision: "approve" | "reject", reason = ""): Promise<string | null> => {
    if (running.current) return "A decision is already being sent.";
    const permission = decision === "approve" ? approvePermission : rejectPermission;
    if (decision === "reject" && !reason.trim()) return "Give the reason the transfer cannot be supplied.";
    const denied = permission.check() ?? decisionProblem(transfer, currentDepartment.current, decision);
    if (denied) return denied;
    running.current = true;
    try {
      const fresh = await read({ ...transferAudit, stockTransferId: transfer.id }, false);
      if ("error" in fresh) return apiErrorMessage(fresh.error);
      const parsed = transferSchema.safeParse(fresh.data);
      if (!parsed.success) return "The current transfer could not be verified. Refresh and try again.";
      const changed = decisionProblem(parsed.data, currentDepartment.current, decision);
      if (changed) return changed;
      if (!sameDecisionEvidence(transfer, parsed.data)) return "This request changed after you opened it. Close this dialog and review the refreshed record.";
      const revoked = permission.check();
      if (revoked) return revoked;
      const result = decision === "approve" ? await approve({ ...transferAudit, stockTransferId: transfer.id })
        : await reject({ ...transferAudit, stockTransferId: transfer.id, domainEntitiesProductionSchedulesStockTransfersRequestRejectStockTransferRequest: { reason: reason.trim() } });
      if ("error" in result) {
        // Never repeat a write automatically after an ambiguous network failure.
        void read({ ...transferAudit, stockTransferId: transfer.id }, false);
        return apiErrorMessage(result.error);
      }
      toast.success(decision === "approve" ? "Transfer approved" : "Transfer rejected");
      return null;
    } finally { running.current = false; }
  };
  return { decide, departmentId, allowed: approvePermission.allowed || rejectPermission.allowed };
}

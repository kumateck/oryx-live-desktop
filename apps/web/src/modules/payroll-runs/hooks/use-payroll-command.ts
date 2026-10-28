import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { approvalsApi } from "@/shared/api/generated/approvals";
import { hrApi } from "@/shared/api/generated/hr";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { readAllPages } from "@/shared/api/read-all-pages";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { payrollApi } from "../api/payroll-api";
import { payrollAudit, payrollPermissions as p, type PayrollRun } from "../schemas/contracts";
import { payrollActionProblem, payrollReconciliation, runEvidence, type PayrollAction } from "../lib/integrity";
export function usePayrollCommand(original: PayrollRun, action: PayrollAction, onDone: () => void) {
  const dispatch = useApiDispatch();
  const require = action === "submit" ? p.create : action === "cancel" ? p.cancel : p.approve;
  const gate = usePermissionAction(action === "approve" ? { kind: "all", permissions: [require, p.payslip, "CanViewActiveEmployee"] } : require);
  const user = useCurrentUser();
  const currentUser = useRef(user?.id);
  currentUser.current = user?.id;
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [read] = payrollApi.useLazyPayrollRunQuery();
  const [slips] = payrollApi.useLazyPayrollRunPayslipsQuery();
  const [employees] = hrApi.useLazyGetApiV1EmployeeQuery();
  const [assigned] = approvalsApi.useLazyGetApiV1ApprovalMyPendingByModelTypeAndModelIdQuery();
  const [approve] = approvalsApi.usePostApiV1ApprovalApproveByModelTypeAndModelIdMutation();
  const [reject] = approvalsApi.usePostApiV1ApprovalRejectByModelTypeAndModelIdMutation();
  const [command] = payrollApi.usePayrollRunCommandMutation();
  const run = async (comments: string): Promise<string | null> => {
    if (running.current) return "A payroll action is already running.";
    const fail = (message: string) => {
      setError(message);
      return message;
    };
    const denied = gate.check();
    if (denied) return fail(denied);
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await read(original.id, false);
      if ("error" in result) return fail(apiErrorMessage(result.error));
      if (!result.data || runEvidence(result.data) !== runEvidence(original))
        return fail("This payroll run changed. Review its current totals and status before continuing.");
      const problem = payrollActionProblem(result.data, action);
      if (problem) return fail(problem);
      if (action === "approve") {
        const signal = new AbortController().signal;
        const [allSlips, active] = await Promise.all([
          readAllPages(
            (page) => slips({ id: original.id, page, pageSize: 100 }, false).unwrap(),
            (row) => row.id,
            signal,
          ),
          readAllPages(
            (page) => employees({ ...payrollAudit, status: 0, page, pageSize: 100 }, false).unwrap(),
            (row) => row.id,
            signal,
          ),
        ]);
        if (active.some((row) => row.status !== 0)) return fail("The active employee register returned an employee whose status is not active. Reconcile the source before approving.");
        const ids = active.flatMap((row) => (row.id ? [row.id] : []));
        const reconciliation = payrollReconciliation(result.data, allSlips, ids);
        if (reconciliation) return fail(reconciliation);
      }
      if (action === "approve" || action === "reject") {
        if (action === "reject" && !comments.trim()) return fail("Explain the rejection reason.");
        const pending = await assigned({ ...payrollAudit, modelType: "PayrollRun", modelId: original.id }, false);
        if ("error" in pending) return fail(apiErrorMessage(pending.error));
        if (pending.data?.id !== original.id || pending.data.modelType !== "PayrollRun" || !pending.data.requestedBy?.id)
          return fail("The active assigned approval stage and requester could not be verified.");
        if (pending.data.requestedBy.id === currentUser.current) return fail("The person who requested this payroll cannot approve or reject their own run.");
        const revoked = gate.check();
        if (revoked) return fail(revoked);
        const decide = action === "approve" ? approve : reject;
        const decision = await decide({
          ...payrollAudit,
          modelType: "PayrollRun",
          modelId: original.id,
          domainEntitiesApprovalsApprovalRequestBody: { comments: comments.trim() },
        });
        if ("error" in decision) return fail(apiErrorMessage(decision.error));
      } else {
        const revoked = gate.check();
        if (revoked) return fail(revoked);
        const changed = await command({ id: original.id, action });
        if ("error" in changed) return fail(apiErrorMessage(changed.error));
      }
      dispatch(
        payrollApi.util.invalidateTags([
          { type: "PayrollRuns", id: "LIST" },
          { type: "PayrollRuns", id: original.id },
        ]),
      );
      toast.success(action === "reject" ? "Payroll rejected and returned to draft" : "Payroll action confirmed");
      onDone();
      return null;
    } catch {
      return fail("The payroll action was not confirmed. Refresh the run and reconcile it before trying again.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { run, busy, error, allowed: gate.allowed };
}

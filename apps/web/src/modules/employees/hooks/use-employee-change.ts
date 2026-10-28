import { useRef, useState } from "react";
import { toast } from "sonner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { employeeApi, type Employee } from "../api/employee-api";
import { employeeAudit } from "../lib/access";
import { employeeEvidence } from "../lib/employee-evidence";
/** The dialog captures its record; fresh reads and current access are checked again at the write boundary. */
export function useEmployeeChange(employee: Employee, permission: string, onDone: () => void) {
  const gate = usePermissionAction(permission); const guard = useRef(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [read] = employeeApi.useLazyGetApiV1EmployeeByIdQuery();
  const run = async (write: (fresh: Employee) => Promise<string | null>, success: string) => {
    if (guard.current) return; const denied = gate.check(); if (denied) { setError(denied); return; }
    if (!employee.id || !employeeEvidence(employee)) { setError("The employee identity, type and status must be recorded before this action."); return; }
    guard.current = true; setBusy(true); setError("");
    try {
      const result = await read({ ...employeeAudit, id: employee.id }, false);
      if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
      if (!result.data || employeeEvidence(employee) !== employeeEvidence(result.data)) { setError("This employee changed. Close the dialog and review the current record."); return; }
      const revoked = gate.check(); if (revoked) { setError(revoked); return; }
      const failed = await write(result.data); if (failed) { setError(failed); return; }
      toast.success(success); onDone();
    } finally { guard.current = false; setBusy(false); }
  };
  return { run, busy, error, allowed: gate.allowed };
}

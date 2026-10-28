import { useRef, useState } from "react";
import { toast } from "sonner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { leaveApi } from "../api/leave-api";
import { leaveAudit, leaveEvidence, type Leave } from "../lib/leave";
export function useLeaveAction(original: Leave, permission: string, onDone: () => void) {
  const gate = usePermissionAction(permission);
  const active = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [read] = leaveApi.useLazyGetApiV1LeaveRequestByIdQuery();
  const run = async (write: (fresh: Leave, check: () => string | null) => Promise<string | null>, success: string): Promise<string | null> => {
    if (active.current) return "A request is already running.";
    const denied = gate.check();
    if (denied) {
      setError(denied);
      return denied;
    }
    if (!original.id || !leaveEvidence(original)) {
      const message = "The request identity, employee, category and status must be verified before this action.";
      setError(message);
      return message;
    }
    active.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await read({ ...leaveAudit, id: original.id }, false);
      const failure =
        "error" in result
          ? apiErrorMessage(result.error)
          : !result.data || leaveEvidence(result.data) !== leaveEvidence(original)
            ? "This request changed. Close the action and review the current record."
            : gate.check();
      if (failure || !result.data) {
        const message = failure ?? "Request unavailable.";
        setError(message);
        return message;
      }
      const failed = await write(result.data, gate.check);
      if (failed) {
        setError(failed);
        return failed;
      }
      toast.success(success);
      onDone();
      return null;
    } catch {
      const message = "The change was not confirmed. Refresh the request before trying again.";
      setError(message);
      return message;
    } finally {
      active.current = false;
      setBusy(false);
    }
  };
  return { run, busy, error, allowed: gate.allowed };
}

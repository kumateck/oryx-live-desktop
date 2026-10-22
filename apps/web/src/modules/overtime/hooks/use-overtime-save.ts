import { useRef, useState } from "react";
import { toast } from "sonner";
import { hrApi } from "@/shared/api/generated/hr";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { overtimeAudit, overtimeEvidence, overtimePermissions as p, OvertimeStatus, type Overtime } from "../lib/overtime";
import { overtimePayload, type OvertimeValues } from "../schemas/overtime-schema";
export function useOvertimeSave(original: Overtime | null, onSaved: (id: string) => void) {
  const gate = usePermissionAction(original ? p.edit : p.create);
  const running = useRef(false);
  const ambiguous = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [read] = hrApi.useLazyGetApiV1OvertimeRequestsByIdQuery();
  const [employees] = hrApi.useLazyGetApiV1EmployeeDepartmentsByIdQuery();
  const [create] = hrApi.usePostApiV1OvertimeRequestsMutation();
  const [update] = hrApi.usePutApiV1OvertimeRequestsByIdMutation();
  const save = async (values: OvertimeValues) => {
    if (running.current) return;
    const denied = gate.check();
    if (denied) {
      setError(denied);
      return;
    }
    if (ambiguous.current) {
      setError("The previous save was not confirmed. Check the overtime register before starting another request.");
      return;
    }
    const body = overtimePayload(values);
    if (!body) {
      setError("Review the required fields and same-day times.");
      return;
    }
    running.current = true;
    setBusy(true);
    setError("");
    try {
      if (original) {
        if (!original.id || original.status !== OvertimeStatus.Pending || !overtimeEvidence(original)) {
          setError("Only a verifiable pending overtime request can be edited.");
          return;
        }
        const current = await read({ ...overtimeAudit, id: original.id }, false);
        if ("error" in current) {
          setError(apiErrorMessage(current.error));
          return;
        }
        if (!current.data || overtimeEvidence(original) !== overtimeEvidence(current.data)) {
          setError("This request changed. Reload and review it before saving.");
          return;
        }
      }
      const members = await employees({ ...overtimeAudit, id: body.departmentId }, false);
      if ("error" in members) {
        setError(apiErrorMessage(members.error));
        return;
      }
      if (!members.data || body.employeeIds.some((id) => members.data?.filter((employee) => employee.id === id && employee.status === 0).length !== 1)) {
        setError("One or more selected employees are no longer active members of this department. Review the selection.");
        return;
      }
      const revoked = gate.check();
      if (revoked) {
        setError(revoked);
        return;
      }
      const result = original?.id
        ? await update({ ...overtimeAudit, id: original.id, domainEntitiesOvertimeRequestsCreateOvertimeRequest: body })
        : await create({ ...overtimeAudit, domainEntitiesOvertimeRequestsCreateOvertimeRequest: body });
      if ("error" in result) {
        if (!original && (!result.error || !("status" in result.error) || typeof result.error.status !== "number" || result.error.status >= 500))
          ambiguous.current = true;
        setError(`${apiErrorMessage(result.error)}${ambiguous.current ? " Check the register before attempting another request." : ""}`);
        return;
      }
      const id = original?.id ?? (typeof result.data === "string" ? result.data : null);
      if (!id) {
        ambiguous.current = true;
        setError("The server did not confirm a request identity. Check the register before creating another request.");
        return;
      }
      toast.success(original ? "Overtime request updated" : "Overtime submitted for approval");
      onSaved(id);
    } catch {
      if (!original) ambiguous.current = true;
      setError("The save was not confirmed. Check the overtime register before trying again.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { save, busy, error, allowed: gate.allowed };
}

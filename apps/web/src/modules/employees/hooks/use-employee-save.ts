import { useRef, useState } from "react";
import { toast } from "sonner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { employeeApi, employeeFileApi, type Employee } from "../api/employee-api";
import { employeeAudit, employeePermissions, type EmployeeType } from "../lib/access";
import { employeeEvidence, preservedEmploymentState } from "../lib/employee-evidence";
import { employeePayload } from "../lib/employee-payload";
import type { EmployeeValues } from "../schemas/employee-schema";
export function useEmployeeSave(original: Employee | null, type: EmployeeType, onSaved: (id: string) => void) {
  const gate = usePermissionAction(original ? employeePermissions.update : employeePermissions.register);
  const guard = useRef(false); const saved = useRef<string | null>(null); const photo = useRef<File | null>(null);
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [savedId, setSavedId] = useState<string | null>(null);
  const [read] = employeeApi.useLazyGetApiV1EmployeeByIdQuery(); const [create] = employeeApi.usePostApiV1EmployeeMutation();
  const [update] = employeeApi.usePutApiV1EmployeeByIdMutation(); const [upload] = employeeFileApi.useUploadEmployeePhotoMutation();
  const save = async (values: EmployeeValues) => {
    if (guard.current) return; const denied = gate.check(); if (denied) { setError(denied); return; }
    guard.current = true; setBusy(true); setError("");
    try {
      if (!saved.current) {
        const payload = employeePayload(values, type);
        if (original) {
          if (!original.id || original.type !== type || !employeeEvidence(original)) { setError("This employee's identity, type or status cannot be verified. Reload the record."); return; }
          const fresh = await read({ ...employeeAudit, id: original.id }, false);
          if ("error" in fresh) { setError(apiErrorMessage(fresh.error)); return; }
          if (!fresh.data || employeeEvidence(original) !== employeeEvidence(fresh.data)) { setError("This employee changed after the editor opened. Review the current record before saving."); return; }
          const revoked = gate.check(); if (revoked) { setError(revoked); return; }
          const result = await update({ ...employeeAudit, id: original.id, domainEntitiesEmployeesUpdateEmployeeRequest: { ...payload, ...preservedEmploymentState(fresh.data), avatar: fresh.data.avatar ?? null } });
          if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
          saved.current = original.id;
        } else {
          const revoked = gate.check(); if (revoked) { setError(revoked); return; }
          const result = await create({ ...employeeAudit, domainEntitiesEmployeesCreateEmployeeRequest: payload });
          if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
          if (!result.data) { setError("The server did not return the employee identity. Verify the employee register before attempting another registration."); return; }
          saved.current = result.data;
        }
        photo.current = values.photo; setSavedId(saved.current);
      }
      const id = saved.current; if (!id) return;
      if (photo.current) {
        const revoked = gate.check(); if (revoked) { setError(`The employee profile was saved. ${revoked}`); return; }
        const result = await upload({ id, file: photo.current });
        if ("error" in result) { setError(`Employee profile saved. The photograph was not confirmed: ${apiErrorMessage(result.error)} Retry only the photograph; this will not create another employee.`); return; }
        photo.current = null;
      }
      setComplete(true); toast.success(original ? "Employee information saved" : "Employee registered"); onSaved(id);
    } finally { guard.current = false; setBusy(false); }
  };
  return { save, busy, error, savedId, complete, allowed: gate.allowed };
}

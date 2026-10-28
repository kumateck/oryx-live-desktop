import { useRef, useState } from "react";
import { toast } from "sonner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { leaveApi, leaveFilesApi } from "../api/leave-api";
import { day, leaveAudit, leaveEvidence, leavePermissions as p, mayEdit, LeaveCategory, type Leave } from "../lib/leave";
import { leaveSchema, type LeaveValues } from "../schemas/leave-schema";
export function useLeaveSave(original: Leave | null, onSaved: (id: string) => void) {
  const gate = usePermissionAction(original ? p.edit : p.create);
  const running = useRef(false);
  const saved = useRef<string | null>(null);
  const pendingFiles = useRef<File[]>([]);
  const ambiguous = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [read] = leaveApi.useLazyGetApiV1LeaveRequestByIdQuery();
  const [readEmployee] = leaveApi.useLazyGetApiV1EmployeeByIdQuery();
  const [readType] = leaveApi.useLazyGetApiV1LeaveTypeByIdQuery();
  const [create] = leaveApi.usePostApiV1LeaveRequestMutation();
  const [update] = leaveApi.usePutApiV1LeaveRequestByIdMutation();
  const [upload] = leaveFilesApi.useAttachLeaveFilesMutation();
  const save = async (values: LeaveValues) => {
    if (running.current) return;
    const denied = gate.check();
    if (denied) {
      setError(denied);
      return;
    }
    running.current = true;
    setBusy(true);
    setError("");
    try {
      if (!saved.current) {
        if (ambiguous.current) {
          setError("The previous save was not confirmed. Check the leave register before starting another request.");
          return;
        }
        const parsed = leaveSchema.safeParse(values);
        if (!parsed.success || !values.employee || !values.from || !values.to) {
          setError("Review the required fields and dates before saving.");
          return;
        }
        if (original) {
          if (!original.id || !leaveEvidence(original) || !mayEdit(original)) {
            setError("This request cannot be edited in its current state.");
            return;
          }
          const fresh = await read({ ...leaveAudit, id: original.id }, false);
          if ("error" in fresh) {
            setError(apiErrorMessage(fresh.error));
            return;
          }
          if (!fresh.data || leaveEvidence(original) !== leaveEvidence(fresh.data)) {
            setError("This request changed after the editor opened. Reload it before saving.");
            return;
          }
          if (!values.leaveType) {
            setError(
              "The current server requires a leave type when updating a request, including exit passes and official duty. Select an eligible type or contact your administrator.",
            );
            return;
          }
        }
        const employee = await readEmployee({ ...leaveAudit, id: values.employee.value }, false);
        if ("error" in employee) {
          setError(apiErrorMessage(employee.error));
          return;
        }
        if (employee.data?.id !== values.employee.value || employee.data.status !== 0) {
          setError("Choose a currently active employee.");
          return;
        }
        if (values.category === LeaveCategory.OfficialDuty && employee.data.type !== 1) {
          setError("Official duty is available only to permanent employees.");
          return;
        }
        if (values.leaveType) {
          const type = await readType({ ...leaveAudit, id: values.leaveType.value }, false);
          if ("error" in type) {
            setError(apiErrorMessage(type.error));
            return;
          }
          if (
            type.data?.id !== values.leaveType.value ||
            type.data.isActive !== true ||
            !employee.data.designation?.id ||
            !type.data.designations?.some((row) => row.id === employee.data?.designation?.id)
          ) {
            setError("The leave type is no longer active or assigned to this employee's designation.");
            return;
          }
        }
        const revoked = gate.check();
        if (revoked) {
          setError(revoked);
          return;
        }
        const body = {
          employeeId: values.employee.value,
          requestCategory: values.category,
          leaveTypeId: values.leaveType?.value ?? null,
          startDate: `${day(values.from)}T00:00:00Z`,
          endDate: `${day(values.to)}T00:00:00Z`,
          contactPerson: values.contactPerson || null,
          contactPersonNumber: values.contactPhone || null,
          destination: values.destination || null,
          justification: values.justification || null,
        };
        const result = original?.id
          ? await update({ ...leaveAudit, id: original.id, domainEntitiesLeaveRequestsCreateLeaveRequest: body })
          : await create({ ...leaveAudit, domainEntitiesLeaveRequestsCreateLeaveRequest: body });
        if ("error" in result) {
          if (!original && (!result.error || !("status" in result.error) || typeof result.error.status !== "number" || result.error.status >= 500))
            ambiguous.current = true;
          setError(
            `${apiErrorMessage(result.error)}${ambiguous.current ? " Check the register before starting another request; it may already have been saved." : ""}`,
          );
          return;
        }
        const id = original?.id ?? (typeof result.data === "string" ? result.data : null);
        if (!id) {
          ambiguous.current = true;
          setError("The server did not return a request ID. Verify the register before creating another request.");
          return;
        }
        saved.current = id;
        setSavedId(id);
        pendingFiles.current = [...values.files];
      }
      const id = saved.current;
      if (!id) return;
      if (pendingFiles.current.length) {
        const revoked = gate.check();
        if (revoked) {
          setError(`The request was saved. ${revoked}`);
          return;
        }
        const result = await upload({ id, files: pendingFiles.current });
        if ("error" in result) {
          setError(
            `Request saved. Attachments were not confirmed: ${apiErrorMessage(result.error)} Retry attachments only; the request will not be created again.`,
          );
          return;
        }
        pendingFiles.current = [];
      }
      toast.success(original ? "Leave request updated" : "Leave request submitted for the server approval workflow");
      onSaved(id);
    } catch {
      setError("The save was not confirmed. Review the leave register before trying again.");
      if (!original && !saved.current) ambiguous.current = true;
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { save, busy, error, savedId, allowed: gate.allowed };
}

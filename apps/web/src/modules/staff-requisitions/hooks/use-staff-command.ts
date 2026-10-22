import { useRef, useState } from "react";
import { toast } from "sonner";
import { hrApi } from "@/shared/api/generated/hr";
import { identityApi } from "@/shared/api/generated/identity";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { mayChangeStaff, staffAudit, staffEvidence, staffPermissions as p, type StaffRequest } from "../lib/staff";
import { staffPayload, type StaffValues } from "../schemas/staff-schema";
export function useStaffCommand(original: StaffRequest | null, mode: "save" | "delete", onDone: (id: string) => void) {
  const gate = usePermissionAction(mode === "delete" ? p.delete : original ? p.edit : p.create);
  const running = useRef(false);
  const ambiguous = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [read] = hrApi.useLazyGetApiV1StaffRequisitionsByIdQuery();
  const [readDepartment] = identityApi.useLazyGetApiV1DepartmentByDepartmentIdQuery();
  const [designations] = hrApi.useLazyGetApiV1DesignationDepartmentByIdQuery();
  const [create] = hrApi.usePostApiV1StaffRequisitionsMutation();
  const [update] = hrApi.usePutApiV1StaffRequisitionsByIdMutation();
  const [remove] = hrApi.useDeleteApiV1StaffRequisitionsByIdMutation();
  const run = async (values?: StaffValues): Promise<string | null> => {
    if (running.current) return "A command is already running.";
    const denied = gate.check();
    if (denied) {
      setError(denied);
      return denied;
    }
    if (ambiguous.current) {
      const message = "The previous save was not confirmed. Check the staff requisition register before creating another request.";
      setError(message);
      return message;
    }
    running.current = true;
    setBusy(true);
    setError("");
    const fail = (message: string) => {
      setError(message);
      return message;
    };
    try {
      if (original) {
        if (!original.id || !mayChangeStaff(original) || !staffEvidence(original)) return fail("Only a verifiable new or pending request can be changed.");
        const fresh = await read({ ...staffAudit, id: original.id }, false);
        if ("error" in fresh) return fail(apiErrorMessage(fresh.error));
        if (!fresh.data || staffEvidence(fresh.data) !== staffEvidence(original))
          return fail("This request changed. Review the current record before continuing.");
      }
      if (mode === "delete") {
        if (!original?.id) return fail("A saved request is required.");
        const revoked = gate.check();
        if (revoked) return fail(revoked);
        const result = await remove({ ...staffAudit, id: original.id });
        if ("error" in result) return fail(apiErrorMessage(result.error));
        toast.success("Staff requisition deleted");
        onDone(original.id);
        return null;
      }
      const body = values ? staffPayload(values, original) : null;
      if (!body) return fail("Review the required fields, whole staff count and date.");
      if (!original && Date.parse(body.requestUrgency) <= Date.now()) return fail("The required-by date must be today or later.");
      const [department, roles] = await Promise.all([
        readDepartment({ ...staffAudit, departmentId: body.departmentId }, false),
        designations({ ...staffAudit, id: body.departmentId }, false),
      ]);
      if ("error" in department) return fail(apiErrorMessage(department.error));
      if ("error" in roles) return fail(apiErrorMessage(roles.error));
      if (department.data?.id !== body.departmentId || !roles.data?.some((role) => role.id === body.designationId))
        return fail("The designation must belong to the current selected department. Refresh the selection.");
      const revoked = gate.check();
      if (revoked) return fail(revoked);
      const payload = { ...body, departmentName: department.data.name ?? null };
      const result = original?.id
        ? await update({ ...staffAudit, id: original.id, domainEntitiesStaffRequisitionsCreateStaffRequisitionRequest: payload })
        : await create({ ...staffAudit, domainEntitiesStaffRequisitionsCreateStaffRequisitionRequest: payload });
      if ("error" in result) {
        if (!original && (!result.error || !("status" in result.error) || typeof result.error.status !== "number" || result.error.status >= 500))
          ambiguous.current = true;
        return fail(`${apiErrorMessage(result.error)}${ambiguous.current ? " Check the register before creating another request." : ""}`);
      }
      const id = original?.id ?? (typeof result.data === "string" ? result.data : null);
      if (!id) {
        ambiguous.current = true;
        return fail("No request ID was confirmed. Check the register before creating another request.");
      }
      toast.success(original ? "Staff requisition updated" : "Staff requisition submitted for approval");
      onDone(id);
      return null;
    } catch {
      if (!original) ambiguous.current = true;
      return fail("The command was not confirmed. Check the register before trying again.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { run, busy, error, allowed: gate.allowed };
}

import { useRef, useState } from "react";
import { toast } from "sonner";
import { hrApi } from "@/shared/api/generated/hr";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { compensationApi } from "../api/compensation-api";
import { adjustmentDurationProblem, adjustmentPayload, type AdjustmentValues } from "../schemas/editor-schema";
import type { AdjustmentKind, Adjustment } from "../schemas/contracts";
export function useAdjustmentCommand(kind: AdjustmentKind, employeeId: string, original: Adjustment | null, onDone: () => void) {
  const gate = usePermissionAction({ kind: "all", permissions: ["CanViewCompensation", "CanManageCompensation"] });
  const running = useRef(false);
  const ambiguous = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [read] = compensationApi.useLazyCompensationAdjustmentsQuery();
  const [employee] = hrApi.useLazyGetApiV1EmployeeByIdQuery();
  const [create] = compensationApi.useCreateCompensationAdjustmentMutation();
  const [remove] = compensationApi.useDeleteCompensationAdjustmentMutation();
  const run = async (values?: AdjustmentValues): Promise<string | null> => {
    if (running.current) return "An adjustment command is already running.";
    const fail = (message: string) => {
      setError(message);
      return message;
    };
    const denied = gate.check();
    if (denied) return fail(denied);
    if (ambiguous.current) return fail("The previous addition was not confirmed. Close this dialog and review the employee's records before adding it again.");
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const records = await read({ employeeId, kind }, false);
      if ("error" in records) return fail(apiErrorMessage(records.error));
      if (!records.data || records.data.some((row) => row.employeeId !== employeeId))
        return fail("The employee's full adjustment records could not be verified.");
      if (original) {
        const fresh = records.data.find((row) => row.id === original.id);
        if (original.employeeId !== employeeId || !fresh || JSON.stringify(fresh) !== JSON.stringify(original))
          return fail("This adjustment changed. Review the current record before deleting it.");
        const revoked = gate.check();
        if (revoked) return fail(revoked);
        const result = await remove({ employeeId, kind, id: original.id });
        if ("error" in result) return fail(apiErrorMessage(result.error));
      } else {
        const durationProblem = values ? adjustmentDurationProblem(values, kind) : null;
        if (durationProblem) return fail(durationProblem);
        const body = values ? adjustmentPayload(values, employeeId, kind) : null;
        if (!body) return fail("Review the adjustment type, amount and effective dates.");
        const person = await employee({ module: "HR Management", subModule: "Employee Compensation", id: employeeId }, false);
        if ("error" in person) return fail(apiErrorMessage(person.error));
        if (person.data?.id !== employeeId || person.data.status !== 0) return fail("The selected employee is no longer active.");
        const duplicate = records.data.some(
          (row) =>
            row.type === body.type &&
            row.amount === body.amount &&
            row.description === body.description &&
            row.effectiveFrom.slice(0, 10) === body.effectiveFrom.slice(0, 10) &&
            row.effectiveTo === body.effectiveTo,
        );
        if (duplicate) return fail("An adjustment with these values already exists. Review it before adding another.");
        const revoked = gate.check();
        if (revoked) return fail(revoked);
        const result = await create({ kind, body });
        if ("error" in result) {
          if (!result.error || !("status" in result.error) || typeof result.error.status !== "number" || result.error.status >= 500) ambiguous.current = true;
          return fail(`${apiErrorMessage(result.error)} Review the employee's records before adding again.`);
        }
      }
      toast.success(original ? "Compensation adjustment deleted" : "Compensation adjustment added");
      onDone();
      return null;
    } catch {
      if (!original) ambiguous.current = true;
      return fail("The change was not confirmed. Review the employee's records before trying again.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { run, busy, error, allowed: gate.allowed };
}

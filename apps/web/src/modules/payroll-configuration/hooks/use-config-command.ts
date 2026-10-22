import { gradesSchema, bandsSchema, pensionsSchema } from "../schemas/contracts";
import { newGradeProblem, newBandProblem, newPensionProblem } from "../lib/config-rules";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { payrollConfigApi } from "../api/config-api";
import type { ConfigRecord, ConfigCommand, ConfigKind } from "../schemas/contracts";
export function useConfigCommand(kind: ConfigKind, original: ConfigRecord | null, onDone: () => void) {
  const gate = usePermissionAction("CanManagePayrollConfiguration");
  const running = useRef(false);
  const ambiguous = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [grades] = payrollConfigApi.useLazyPayrollGradesQuery();
  const [bands] = payrollConfigApi.useLazyPayrollTaxBandsQuery();
  const [rates] = payrollConfigApi.useLazyPayrollPensionRatesQuery();
  const [save] = payrollConfigApi.useSavePayrollConfigMutation();
  const [remove] = payrollConfigApi.useDeletePayrollConfigMutation();
  const run = async (command: ConfigCommand | "delete"): Promise<string | null> => {
    if (running.current) return "A configuration change is already running.";
    const fail = (message: string) => {
      setError(message);
      return message;
    };
    const denied = gate.check();
    if (denied) return fail(denied);
    if (ambiguous.current) return fail("The previous save was not confirmed. Close this dialog and check the configuration before adding it again.");
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const result = kind === "grade" ? await grades(undefined, false) : kind === "band" ? await bands(undefined, false) : await rates(undefined, false);
      if ("error" in result) return fail(apiErrorMessage(result.error));
      if (!result.data) return fail("Current configuration could not be verified.");
      if (original) {
        const fresh = result.data.find((row) => row.id === original.row.id);
        if (!fresh || JSON.stringify(fresh) !== JSON.stringify(original.row))
          return fail("This configuration changed. Close this dialog and review the current values.");
      }
      if (command !== "delete") {
        if (command.kind !== kind || (command.kind === "grade" && command.id !== (original?.kind === "grade" ? original.row.id : undefined)))
          return fail("The configuration identity changed. Reopen this dialog.");
        const duplicate =
          command.kind === "grade"
            ? newGradeProblem(command, gradesSchema.parse(result.data))
            : command.kind === "band"
              ? newBandProblem(command, bandsSchema.parse(result.data))
              : newPensionProblem(command, pensionsSchema.parse(result.data));
        if (duplicate) return fail(duplicate);
      }
      const revoked = gate.check();
      if (revoked) return fail(revoked);
      if (command === "delete") {
        if (!original || original.kind !== kind) return fail("Select a saved configuration to delete.");
        const deleted = await remove({ kind, id: original.row.id });
        if ("error" in deleted) return fail(apiErrorMessage(deleted.error));
      } else {
        if (command.kind !== kind) return fail("The configuration type changed. Reopen the dialog.");
        const saved = await save(command);
        if ("error" in saved) {
          if (!original && (!saved.error || !("status" in saved.error) || typeof saved.error.status !== "number" || saved.error.status >= 500))
            ambiguous.current = true;
          return fail(`${apiErrorMessage(saved.error)}${ambiguous.current ? " Review configuration before adding again." : ""}`);
        }
      }
      toast.success(command === "delete" ? "Payroll configuration deleted" : "Payroll configuration saved");
      onDone();
      return null;
    } catch {
      if (!original && command !== "delete") ambiguous.current = true;
      return fail("The change was not confirmed. Review the configuration before trying again.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { run, busy, error, allowed: gate.allowed };
}

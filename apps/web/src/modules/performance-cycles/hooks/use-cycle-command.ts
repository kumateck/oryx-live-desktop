import { useRef, useState } from "react";
import { toast } from "sonner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { performanceApi } from "@/shared/performance/api";
import type { Cycle, CreateCycle, CycleStatus } from "@/shared/performance/contracts";
import { cycleTransitionProblem, cycleCreateProblem } from "../lib/rules";
export function useCycleCommand(onDone: () => void) {
  const gate = usePermissionAction({ kind: "all", permissions: ["CanManagePerformanceCycles", "CanViewPerformanceCycles"] });
  const running = useRef(false);
  const ambiguous = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cycles] = performanceApi.useLazyPerformanceCyclesQuery();
  const [read] = performanceApi.useLazyPerformanceCycleQuery();
  const [create] = performanceApi.useCreatePerformanceCycleMutation();
  const [change] = performanceApi.useChangePerformanceCycleMutation();
  const run = async (command: { kind: "create"; body: CreateCycle } | { kind: "status"; original: Cycle; status: CycleStatus }): Promise<string | null> => {
    if (running.current) return "A cycle change is already running.";
    const fail = (message: string) => {
      setError(message);
      return message;
    };
    const denied = gate.check();
    if (denied) return fail(denied);
    if (ambiguous.current) return fail("The previous create was not confirmed. Review the cycle register before creating it again.");
    running.current = true;
    setBusy(true);
    setError("");
    try {
      if (command.kind === "create") {
        const result = await cycles(undefined, false);
        if (result.error) return fail(apiErrorMessage(result.error));
        if (!result.data) return fail("The current cycle register could not be verified.");
        const problem = cycleCreateProblem(command.body, result.data);
        if (problem) return fail(problem);
      } else {
        const result = await read(command.original.id, false);
        if (result.error) return fail(apiErrorMessage(result.error));
        if (!result.data) return fail("The cycle could not be verified.");
        const problem = cycleTransitionProblem(command.original, result.data, command.status);
        if (problem) return fail(problem);
      }
      const revoked = gate.check();
      if (revoked) return fail(revoked);
      const result = command.kind === "create" ? await create(command.body) : await change({ id: command.original.id, status: command.status });
      if ("error" in result) {
        if (
          command.kind === "create" &&
          (!result.error || !("status" in result.error) || typeof result.error.status !== "number" || result.error.status >= 500)
        )
          ambiguous.current = true;
        return fail(apiErrorMessage(result.error));
      }
      toast.success(command.kind === "create" ? "Performance cycle created" : "Cycle status updated");
      onDone();
      return null;
    } catch {
      if (command.kind === "create") ambiguous.current = true;
      return fail("The change was not confirmed. Refresh the cycle register before trying again.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { run, busy, error, allowed: gate.allowed };
}

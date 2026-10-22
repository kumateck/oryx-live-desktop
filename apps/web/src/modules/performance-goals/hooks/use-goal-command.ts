import { useRef, useState } from "react";
import { toast } from "sonner";
import { hrApi } from "@/shared/api/generated/hr";
import { readAllPages } from "@/shared/api/read-all-pages";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { performanceApi } from "@/shared/performance/api";
import { performanceAudit, CycleStatus, type Goal, type CreateGoal, type UpdateGoal } from "@/shared/performance/contracts";
import { goalProblem } from "../lib/rules";
/** Saves or deletes a goal after re-reading the cycle and goals. `personal` is the signed-in employee acting on their own goals. */
export function useGoalCommand(original: Goal | null, action: "save" | "delete", onDone: () => void, personal = false) {
  const require = action === "delete" ? "CanDeleteGoal" : original ? "CanEditGoal" : "CanCreateGoal";
  const gate = usePermissionAction({
    kind: "all",
    permissions: [require, "CanViewOwnGoals", "CanViewPerformanceCycles", ...(personal ? [] : ["CanViewTeamGoals", ...(action === "save" ? ["CanViewEmployeeDetails"] : [])])],
  });
  const running = useRef(false);
  const ambiguous = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cycle] = performanceApi.useLazyPerformanceCycleQuery();
  const [goals] = performanceApi.useLazyPerformanceGoalsQuery();
  const [employee] = hrApi.useLazyGetApiV1EmployeeByIdQuery();
  const [me] = hrApi.useLazyGetApiV1EmployeeMeQuery();
  const [create] = performanceApi.useCreatePerformanceGoalMutation();
  const [update] = performanceApi.useUpdatePerformanceGoalMutation();
  const [remove] = performanceApi.useDeletePerformanceGoalMutation();
  const run = async (body: CreateGoal, updateValues?: UpdateGoal): Promise<string | null> => {
    if (running.current) return "A goal change is already running.";
    const fail = (m: string) => {
      setError(m);
      return m;
    };
    const denied = gate.check();
    if (denied) return fail(denied);
    if (ambiguous.current) return fail("The previous create was not confirmed. Review the goal register before adding it again.");
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const [currentCycle, rows] = await Promise.all([
        cycle(body.cycleId, false).unwrap(),
        readAllPages(
          (page) => goals({ employeeId: body.employeeId, cycleId: body.cycleId, page, pageSize: 100 }, false).unwrap(),
          (r) => r.id,
          new AbortController().signal,
        ),
      ]);
      if (original && (original.employeeId !== body.employeeId || original.cycleId !== body.cycleId))
        return fail("The employee or cycle changed. Reopen the record.");
      if (action === "delete") {
        if (
          !original ||
          currentCycle.id !== original.cycleId ||
          currentCycle.status === CycleStatus.Closed ||
          !rows.some((r) => JSON.stringify(r) === JSON.stringify(original))
        )
          return fail("The goal or cycle changed. Refresh before deleting.");
      } else {
        const problem = goalProblem(body, currentCycle, rows, original ?? undefined);
        if (problem) return fail(problem);
        const freshEmployee = personal ? await me(performanceAudit, false).unwrap() : await employee({ ...performanceAudit, id: body.employeeId }, false).unwrap();
        if (freshEmployee.id !== body.employeeId || freshEmployee.status !== 0) return fail("Only an active employee can receive or update goals.");
      }
      const revoked = gate.check();
      if (revoked) return fail(revoked);
      const result =
        action === "delete" && original
          ? await remove(original.id)
          : original && updateValues
            ? await update({ id: original.id, body: updateValues })
            : !original
              ? await create(body)
              : null;
      if (!result) return fail("The goal update is incomplete. Reopen the editor.");
      if ("error" in result) {
        if (!original && (!result.error || !("status" in result.error) || typeof result.error.status !== "number" || result.error.status >= 500))
          ambiguous.current = true;
        return fail(apiErrorMessage(result.error));
      }
      toast.success(action === "delete" ? "Goal deleted" : "Goal saved");
      onDone();
      return null;
    } catch {
      if (!original) ambiguous.current = true;
      return fail("The goal change was not confirmed. Review the register before trying again.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { run, busy, error, allowed: gate.allowed };
}

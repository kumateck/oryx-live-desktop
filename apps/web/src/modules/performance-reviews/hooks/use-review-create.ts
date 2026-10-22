import { useRef, useState } from "react";
import { hrApi } from "@/shared/api/generated/hr";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { performanceApi } from "@/shared/performance/api";
import { CycleStatus, performanceAudit, type CreateReview } from "@/shared/performance/contracts";
export function useReviewCreate(onDone: (id: string) => void) {
  const gate = usePermissionAction({
    kind: "all",
    permissions: ["CanManagePerformanceCycles", "CanViewPerformanceCycles", "CanViewEmployeeDetails", "CanViewActiveEmployee", "CanViewPerformanceReviews"],
  });
  const running = useRef(false);
  const ambiguous = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cycle] = performanceApi.useLazyPerformanceCycleQuery();
  const [employee] = hrApi.useLazyGetApiV1EmployeeByIdQuery();
  const [create] = performanceApi.useCreatePerformanceReviewMutation();
  const run = async (body: CreateReview) => {
    if (running.current) return;
    const fail = (m: string) => setError(m);
    const denied = gate.check();
    if (denied) return fail(denied);
    if (ambiguous.current) return fail("The previous create was not confirmed. Review the register before starting another review.");
    running.current = true;
    setBusy(true);
    setError("");
    try {
      if (body.employeeId === body.reviewerId) return fail("Choose a different employee as reviewer.");
      const [c, e, r] = await Promise.all([
        cycle(body.cycleId, false).unwrap(),
        employee({ ...performanceAudit, id: body.employeeId }, false).unwrap(),
        employee({ ...performanceAudit, id: body.reviewerId }, false).unwrap(),
      ]);
      if (c.id !== body.cycleId || c.status !== CycleStatus.Active) return fail("Start reviews only in an active cycle.");
      if (e.id !== body.employeeId || r.id !== body.reviewerId || e.status !== 0 || r.status !== 0)
        return fail("The employee and reviewer must both be active employees.");
      const revoked = gate.check();
      if (revoked) return fail(revoked);
      const result = await create(body);
      if ("error" in result) {
        if (!result.error || !("status" in result.error) || typeof result.error.status !== "number" || result.error.status >= 500) ambiguous.current = true;
        return fail(apiErrorMessage(result.error));
      }
      onDone(result.data);
    } catch {
      ambiguous.current = true;
      fail("The review could not be confirmed. Check the register before creating another.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { run, busy, error, allowed: gate.allowed };
}

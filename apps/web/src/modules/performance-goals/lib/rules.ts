import { CycleStatus, type Cycle, type Goal, type CreateGoal, type UpdateGoal } from "@/shared/performance/contracts";
export function goalProblem(body: CreateGoal, cycle: Cycle, rows: Goal[], original?: Goal): string | null {
  if (cycle.id !== body.cycleId || cycle.status === CycleStatus.Closed) return "Choose a draft or active cycle. Closed cycles cannot be changed.";
  const target = body.targetDate.slice(0, 10);
  if (target < cycle.periodStart.slice(0, 10) || target > cycle.periodEnd.slice(0, 10)) return "The target date must fall within the cycle period.";
  if (rows.some((r) => r.employeeId !== body.employeeId || r.cycleId !== body.cycleId))
    return "The goal list includes another employee or cycle. No change was sent.";
  if (original && !rows.some((r) => r.id === original.id && JSON.stringify(r) === JSON.stringify(original)))
    return "This goal changed. Close the editor and review the current record.";
  if (rows.some((r) => r.id !== original?.id && r.title.trim().toLocaleLowerCase() === body.title.trim().toLocaleLowerCase()))
    return "This employee already has a goal with this title in the selected cycle.";
  if (rows.some((r) => !Number.isInteger(r.weight) || r.weight < 1 || r.weight > 100))
    return "Existing goal weights are invalid. Reconcile them before adding or editing a goal.";
  if (rows.filter((r) => r.id !== original?.id).reduce((total, r) => total + r.weight, 0) + body.weight > 100)
    return "The employee's total goal weight for this cycle cannot exceed 100%.";
  return null;
}
export function updateBody(body: CreateGoal, status: Goal["status"], progressPercentage: number, managerComments: string): UpdateGoal {
  return { title: body.title, description: body.description, weight: body.weight, targetDate: body.targetDate, status, progressPercentage, managerComments };
}

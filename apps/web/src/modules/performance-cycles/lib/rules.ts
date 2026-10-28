import { CycleStatus, type Cycle, type CreateCycle } from "@/shared/performance/contracts";
export function cycleTransitionProblem(original: Cycle, fresh: Cycle, status: CycleStatus): string | null {
  if (JSON.stringify(original) !== JSON.stringify(fresh)) return "This cycle changed. Close the dialog and review its current status and counts.";
  if (!((fresh.status === CycleStatus.Draft && status === CycleStatus.Active) || (fresh.status === CycleStatus.Active && status === CycleStatus.Closed)))
    return "Only a draft cycle can be activated, and only an active cycle can be closed.";
  return null;
}
export function cycleCreateProblem(body: CreateCycle, rows: Cycle[]): string | null {
  if (!body.name.trim() || body.name.trim().length > 200) return "Enter a cycle name of up to 200 characters.";
  if (!(Date.parse(body.periodEnd) > Date.parse(body.periodStart))) return "The end date must follow the start date.";
  if (
    rows.some(
      (row) =>
        row.name.trim().toLocaleLowerCase() === body.name.trim().toLocaleLowerCase() &&
        row.periodStart.slice(0, 10) === body.periodStart.slice(0, 10) &&
        row.periodEnd.slice(0, 10) === body.periodEnd.slice(0, 10),
    )
  )
    return "A cycle with this name and period already exists.";
  return null;
}

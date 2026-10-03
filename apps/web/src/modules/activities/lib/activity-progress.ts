import type { Activity, ActivityStep } from "../schemas/activity-schema";
import { stepStatus } from "./step-status";

export type StepPosition = "done" | "current" | "upcoming";
/** Where a step sits in the run: behind the current step, the current step, or still ahead. */
export function stepPosition(step: Pick<ActivityStep, "id" | "status">, currentStepId: string | null): StepPosition {
  if (step.status === stepStatus.completed) return "done";
  return step.id === currentStepId ? "current" : "upcoming";
}

/** How far a run is: steps finished out of all steps, and the step it is on. */
export function activityProgress(activity: Pick<Activity, "steps" | "currentStepId">) {
  const total = activity.steps.length;
  const done = activity.steps.filter((step) => step.status === stepStatus.completed).length;
  const current = activity.steps.find((step) => step.id === activity.currentStepId) ?? null;
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0, current, finished: total > 0 && done === total };
}

const minute = 60_000;
/** "3 d 4 h", "2 h 15 min", "40 min", "under a minute". Null when either end is missing or unreadable. */
export function duration(from: string | null | undefined, to: string | null | undefined | Date = new Date()): string | null {
  const start = from ? new Date(from).getTime() : Number.NaN;
  const end = to instanceof Date ? to.getTime() : to ? new Date(to).getTime() : Number.NaN;
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  const minutes = Math.floor((end - start) / minute);
  if (minutes < 1) return "under a minute";
  const days = Math.floor(minutes / 1440), hours = Math.floor((minutes % 1440) / 60), rest = minutes % 60;
  if (days) return hours ? `${days} d ${hours} h` : `${days} d`;
  if (hours) return rest ? `${hours} h ${rest} min` : `${hours} h`;
  return `${rest} min`;
}

/** How long a step took, or has been running. Null for a step that has not started. */
export function stepDuration(step: Pick<ActivityStep, "startedAt" | "completedAt">, now = new Date()): string | null {
  return step.startedAt ? duration(step.startedAt, step.completedAt ?? now) : null;
}

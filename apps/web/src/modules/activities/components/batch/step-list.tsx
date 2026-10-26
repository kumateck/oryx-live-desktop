import { Check, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { cn } from "cn";
import { formatDateTime } from "@/shared/format/dates";
import { stepPath } from "../../lib/activity-access";
import { stepDuration, stepPosition } from "../../lib/activity-progress";
import type { Activity, ActivityStep } from "../../schemas/activity-schema";
import { People } from "../people";
import { StepStatusBadge } from "../step-status-badge";
import { StepTypeBadge } from "../step-type-badge";
import { StepWorkspace } from "../step/step-workspace";

function StepMarker({ step, position }: { step: ActivityStep; position: "done" | "current" | "upcoming" }) {
  return <span aria-hidden="true" className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
    position === "done" && "border-primary bg-primary text-primary-foreground", position === "current" && "border-primary text-primary ring-4 ring-primary/15",
    position === "upcoming" && "text-muted-foreground")}>{position === "done" ? <Check className="size-4" /> : step.order}</span>;
}

/** Every step of the run in order. The current step is open with its actions; any step can be opened on its own page. */
export function StepList({ activity }: { activity: Activity }) {
  return <ol className="min-w-0 space-y-2" aria-label="Production steps">{activity.steps.map((step) => {
    const position = stepPosition(step, activity.currentStepId);
    const current = position === "current";
    const took = stepDuration(step);
    return <li key={step.id} aria-current={current ? "step" : undefined} className={cn("min-w-0 rounded-lg border bg-card", current && "border-primary shadow-xs", position === "upcoming" && "opacity-80")}>
      <div className="flex min-w-0 items-start gap-3 p-3">
        <StepMarker step={step} position={position} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Link to={stepPath(activity.id, step.id)} className="min-w-0 break-words font-medium underline-offset-2 hover:underline">{step.name}</Link>
            <StepStatusBadge status={step.status} />
            <StepTypeBadge critical={step.critical} />
          </div>
          <p className="flex min-w-0 flex-wrap gap-x-3 text-xs text-muted-foreground">
            {step.workCenters.length ? <span className="break-words">{step.workCenters.join(", ")}</span> : null}
            {took ? <span title={`Started ${formatDateTime(step.startedAt) ?? ""}`}>{step.completedAt ? `took ${took}` : `running ${took}`}</span> : null}
            {step.completedAt ? <span>finished {formatDateTime(step.completedAt) ?? ""}</span> : null}
          </p>
        </div>
        <People people={step.team} />
        <Link to={stepPath(activity.id, step.id)} aria-label={`Open step ${step.order}, ${step.name}`} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"><ChevronRight className="size-4" /></Link>
      </div>
      {current && !activity.batch.cancelled ? <div className="border-t p-3"><StepWorkspace activity={activity} step={step} /></div> : null}
    </li>;
  })}</ol>;
}

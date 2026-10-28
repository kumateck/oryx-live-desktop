import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/shared/auth/user-avatar";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDateTime } from "@/shared/format/dates";
import { batchBoardPath, stepPath } from "../../lib/activity-access";
import { stepDuration, stepPosition } from "../../lib/activity-progress";
import { stepActionLabel } from "../../lib/step-status";
import type { Activity, ActivityStep } from "../../schemas/activity-schema";
import { ActivityLog } from "../batch/activity-log";
import { StepStatusBadge } from "../step-status-badge";
import { StepTypeBadge } from "../step-type-badge";
import { StepActionRecords } from "./records/step-action-records";
import { StepWorkspace } from "./step-workspace";

const positions = { done: "Completed step", current: "Current step", upcoming: "Upcoming step" } as const;

/** One step on its own page: what it is, who carries it out, how long it has taken, and its actions. */
export function StepDetail({ activity, step }: { activity: Activity; step: ActivityStep }) {
  const index = activity.steps.findIndex((item) => item.id === step.id);
  const previous = activity.steps[index - 1];
  const next = activity.steps[index + 1];
  const position = stepPosition(step, activity.currentStepId);
  const took = stepDuration(step);
  // One person can hold several instructions; list each person with all of theirs.
  const team = step.team.filter((member, at) => step.team.findIndex((other) => (other.id ?? other.name) === (member.id ?? member.name)) === at)
    .map((member) => ({ ...member, actions: step.team.filter((other) => (other.id ?? other.name) === (member.id ?? member.name)).flatMap((other) => other.action !== null ? [stepActionLabel(other.action)] : []) }));

  return <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
    <div className="min-w-0 space-y-4">
      <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-muted text-base font-semibold">{step.order}</span>
          <h2 className="min-w-0 break-words text-lg font-semibold">{step.name}</h2>
          <StepStatusBadge status={step.status} /><StepTypeBadge critical={step.critical} /><Badge variant="outline">{positions[position]}</Badge>
        </div>
        {step.description ? <p className="break-words text-sm text-muted-foreground">{step.description}</p> : null}
        <StepWorkspace activity={activity} step={step} />
      </section>
      <StepActionRecords activity={activity} step={step} />
      <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold">Responsible <span className="font-normal text-muted-foreground">({team.length})</span></h2>
        {team.length === 0 ? <p className="text-sm text-muted-foreground">No one is assigned to this step.</p>
          : <ul className="grid gap-2 sm:grid-cols-2">{team.map((member) => <li key={member.id ?? member.name} className="flex min-w-0 items-center gap-2 rounded-md border p-2">
            <UserAvatar user={member} size="sm" />
            <div className="min-w-0"><p className="break-words text-sm font-medium">{member.name}</p>
              <p className="break-words text-xs text-muted-foreground">{member.actions.length ? member.actions.join(", ") : "No instruction set"}</p></div>
          </li>)}</ul>}
      </section>
      <nav aria-label="Other steps" className="flex flex-wrap items-center justify-between gap-2">
        {previous ? <Button asChild size="sm" variant="outline"><Link to={stepPath(activity.id, previous.id)}><ChevronLeft />{previous.order}. {previous.name}</Link></Button> : <span />}
        <Button asChild size="sm" variant="ghost"><Link to={batchBoardPath(activity.id)}>All steps</Link></Button>
        {next ? <Button asChild size="sm" variant="outline"><Link to={stepPath(activity.id, next.id)}>{next.order}. {next.name}<ChevronRight /></Link></Button> : <span />}
      </nav>
    </div>
    <div className="min-w-0 space-y-4">
      <DetailGroup title="Timing">
        <DetailItem label="Started" value={formatDateTime(step.startedAt)} />
        <DetailItem label="Finished" value={formatDateTime(step.completedAt)} />
        <DetailItem label={step.completedAt ? "Took" : "Running for"} value={took} />
        <DetailItem label="Work centers" value={step.workCenters.join(", ")} />
      </DetailGroup>
      <ActivityLog logs={activity.logs} />
    </div>
  </div>;
}

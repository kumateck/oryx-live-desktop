import { Badge } from "@/components/ui/badge";
import { stepStatus, stepStatusLabel } from "../lib/step-status";

const variants = { [stepStatus.new]: "outline", [stepStatus.inProgress]: "default", [stepStatus.completed]: "secondary", [stepStatus.delayed]: "destructive", [stepStatus.cancelled]: "destructive" } as const;

/**
 * `waiting` is for a batch card on the production board: there the batch has started and sits at a step no one has begun,
 * so "Not started" read as if the batch itself had not started.
 */
export function StepStatusBadge({ status, waiting = false }: { status: number; waiting?: boolean }) {
  return <Badge variant={variants[status as keyof typeof variants] ?? "outline"}>{waiting && status === stepStatus.new ? "Waiting" : stepStatusLabel(status)}</Badge>;
}

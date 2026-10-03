import { Badge } from "@/components/ui/badge";
import { stepStatus, stepStatusLabel } from "../lib/step-status";

const variants = { [stepStatus.new]: "outline", [stepStatus.inProgress]: "default", [stepStatus.completed]: "secondary", [stepStatus.delayed]: "destructive", [stepStatus.cancelled]: "destructive" } as const;

export function StepStatusBadge({ status }: { status: number }) {
  return <Badge variant={variants[status as keyof typeof variants] ?? "outline"}>{stepStatusLabel(status)}</Badge>;
}

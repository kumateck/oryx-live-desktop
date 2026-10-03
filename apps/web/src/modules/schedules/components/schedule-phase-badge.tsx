import { Badge } from "@/components/ui/badge";
import type { SchedulePhase } from "../lib/schedule-dates";

const phases: Record<SchedulePhase, { label: string; variant: "default" | "secondary" | "outline" }> = {
  upcoming: { label: "Upcoming", variant: "outline" }, running: { label: "In progress", variant: "default" }, ended: { label: "Ended", variant: "secondary" },
};

export function SchedulePhaseBadge({ phase }: { phase: SchedulePhase }) {
  return <Badge variant={phases[phase].variant}>{phases[phase].label}</Badge>;
}

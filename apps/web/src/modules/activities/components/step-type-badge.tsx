import { Bot, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** Shows whether a step starts automatically or is carried out by assigned people. */
export function StepTypeBadge({ critical }: { critical: boolean }) {
  const Icon = critical ? UserRound : Bot;
  const label = critical ? "Critical" : "Automated";
  const description = critical ? "Started and completed by assigned people" : "Starts automatically only when active; a person completes this step";
  return <Badge variant="outline" title={description} aria-label={description}><Icon aria-hidden="true" className="size-3" />{label}</Badge>;
}

import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { toLargestUnit } from "@/shared/units/quantity";
import { batchBoardPath } from "../../lib/activity-access";
import { duration } from "../../lib/activity-progress";
import { stepStatus } from "../../lib/step-status";
import type { BoardCard } from "../../schemas/activity-schema";
import { People } from "../people";
import { StepStatusBadge } from "../step-status-badge";

/** One running batch on the board. The whole card opens the batch. */
export function ActivityCard({ card }: { card: BoardCard }) {
  const size = toLargestUnit(card.quantity, card.unit, "calculated")?.text;
  // How long the batch has sat at this operation is what tells a supervisor it is stuck.
  const waiting = duration(card.stepStartedAt ?? card.startedAt);
  return <Link to={batchBoardPath(card.activityId)} className="block space-y-2 rounded-lg border bg-card p-3 text-sm shadow-xs hover:border-primary focus-visible:outline-2">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Badge variant="outline" className="font-mono">{card.batchNumber ?? "No batch number"}</Badge>
      <StepStatusBadge status={card.stepStatus} />
    </div>
    <div className="min-w-0"><p className="break-words font-semibold">{card.productName}</p>
      <p className="text-xs text-muted-foreground">{[card.productCode, size, card.scheduleCode].filter(Boolean).join(" · ")}</p></div>
    <div className="flex items-center justify-between gap-2">
      <People people={card.team} />
      <span className="text-xs text-muted-foreground">{card.stepStatus === stepStatus.new ? "waiting" : "running"}{waiting ? ` ${waiting}` : ""}{card.critical ? " · critical" : ""}</span>
    </div>
  </Link>;
}

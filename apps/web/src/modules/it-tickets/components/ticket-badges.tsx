import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/shared/format/dates";
import { isOverdue, priorityLabels, statusLabels, type TicketPriority, type TicketStatus } from "../lib/tickets";

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge variant={priority === 3 ? "destructive" : priority === 2 ? "default" : priority === 1 ? "secondary" : "outline"}>{priorityLabels[priority]}</Badge>;
}
export function StatusBadge({ status }: { status: TicketStatus }) {
  return <Badge variant={status === 3 ? "default" : status === 4 ? "outline" : "secondary"}>{statusLabels[status]}</Badge>;
}
/** A due date, marked when it has passed and the work is not done. */
export function DueDate({ dueDate, status }: { dueDate: string | null; status: TicketStatus }) {
  if (!dueDate) return <span className="text-muted-foreground">–</span>;
  const overdue = isOverdue(dueDate, status);
  return <span className={overdue ? "font-medium text-destructive" : undefined}>{formatDate(dueDate) ?? "–"}{overdue ? " · overdue" : ""}</span>;
}

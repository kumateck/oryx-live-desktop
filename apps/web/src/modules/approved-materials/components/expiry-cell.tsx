import { Badge } from "@/components/ui/badge";
import { formatMonthYear } from "@/shared/format/dates";
import { daysUntil, dueText } from "@/shared/format/due-dates";
import { expiryState } from "../lib/stock";

/** An expiry date, flagged when it has passed or is close. */
export function ExpiryCell({ date }: { date: string | null | undefined }) {
  const shown = formatMonthYear(date);
  if (!shown) return <span className="text-muted-foreground">No expiry</span>;
  const state = expiryState(date);
  const days = daysUntil(date);
  return <div className="space-y-0.5"><div>{shown}</div>
    {state === "overdue" ? <Badge variant="destructive">Expired</Badge>
      : state === "soon" && days !== null ? <Badge variant="outline" className="border-amber-500/60 text-amber-700 dark:text-amber-400">Expires {dueText(days)}</Badge> : null}</div>;
}

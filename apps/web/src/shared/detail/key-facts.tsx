import type { ReactNode } from "react";
import { cn } from "cn";
import type { DueState } from "../format/due-dates";

const tone: Record<DueState, string> = { none: "", ok: "", soon: "text-amber-700 dark:text-amber-400", overdue: "text-destructive" };

/** The strip of figures at the top of a record page. Hold `KeyFact`s. */
export function KeyFacts({ children }: { children: ReactNode }) {
  return <dl className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{children}</dl>;
}

/** One figure with a line of context. `state` colours it when it is due soon or overdue. */
export function KeyFact({ label, value, note, state = "none" }: { label: string; value: ReactNode; note?: ReactNode; state?: DueState }) {
  return <div className="min-w-0 rounded-lg border bg-card p-3">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className={cn("mt-1 min-w-0 break-words text-lg font-semibold leading-tight", tone[state])}>{value}</dd>
    {note ? <dd className={cn("mt-0.5 text-xs text-muted-foreground", tone[state])}>{note}</dd> : null}
  </div>;
}

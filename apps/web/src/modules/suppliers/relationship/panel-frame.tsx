import type { ReactNode } from "react";

/** The heading of a tab's records: what they are, a line of guidance, and the action that adds one. */
export function PanelHeading({ title, note, action }: { title: string; note?: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-2">
    <div className="min-w-0"><h2 className="text-sm font-semibold">{title}</h2>{note ? <p className="text-xs text-muted-foreground">{note}</p> : null}</div>
    {action}
  </div>;
}

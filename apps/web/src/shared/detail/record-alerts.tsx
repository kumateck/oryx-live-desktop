import { CircleAlert, TriangleAlert } from "lucide-react";

/** Something on a record that needs attention. `tab` names the tab holding the records it is about. */
export interface RecordAlert { id: string; level: "problem" | "warning"; text: string; tab?: string }

/** Problems before warnings, otherwise in the order given. */
export function sortAlerts(alerts: readonly RecordAlert[]): RecordAlert[] {
  return [...alerts].sort((a, b) => Number(b.level === "problem") - Number(a.level === "problem"));
}

/** What needs attention, above everything else on a record page. Renders nothing when all is in order. */
export function RecordAlerts({ alerts, onOpenTab }: { alerts: readonly RecordAlert[]; onOpenTab: (tab: string) => void }) {
  if (alerts.length === 0) return null;
  return <ul aria-label="Needs attention" className="space-y-1.5">{alerts.map((alert) => <li key={alert.id}
    className={alert.level === "problem" ? "flex flex-wrap items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm"
      : "flex flex-wrap items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm"}>
    {alert.level === "problem" ? <CircleAlert className="size-4 shrink-0 text-destructive" aria-hidden="true" /> : <TriangleAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />}
    <span className="min-w-0 break-words">{alert.text}</span>
    {alert.tab ? <button type="button" className="text-sm font-medium underline underline-offset-2" onClick={() => { if (alert.tab) onOpenTab(alert.tab); }}>Review</button> : null}
  </li>)}</ul>;
}

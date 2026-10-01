import type { ReactNode } from "react";

/** A titled group of label and value pairs on a record page. */
export function DetailGroup({ title, children }: { title: string; children: ReactNode }) {
  return <section className="min-w-0 rounded-lg border bg-card p-4">
    <h2 className="mb-2 text-sm font-semibold">{title}</h2>
    <dl className="divide-y">{children}</dl>
  </section>;
}

/** One fact. A missing value is shown as a dash, never as "undefined" or an empty gap. */
export function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  const missing = value === null || value === undefined || value === "" || value === false;
  return <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-1.5 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className={`min-w-0 break-words ${missing ? "text-muted-foreground" : ""}`}>{missing ? "–" : value}</dd>
  </div>;
}

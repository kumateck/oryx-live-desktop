import type { ReactNode } from "react";
import { RefreshCw, type LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { hasResults, updatedAgo } from "./periods";

type QueryError = Parameters<typeof apiErrorMessage>[0];
export interface ReportQuery { data?: unknown; error?: QueryError; isLoading: boolean; isFetching: boolean; fulfilledTimeStamp?: number | undefined; refetch: () => unknown }
const number = (value: number) => value.toLocaleString();

/** The top of a dashboard: its name, when its figures were last read, a period switch and a refresh button. */
export function DashboardHeading<TPeriod extends string>({ eyebrow, title, description, queries, period, periods, onPeriod, actions }: {
  eyebrow: string; title: string; description: string; queries: readonly ReportQuery[]; period?: TPeriod; periods?: readonly { value: TPeriod; label: string }[]; onPeriod?: (period: TPeriod) => void; actions?: ReactNode }) {
  const fetching = queries.some((query) => query.isFetching);
  const latest = Math.max(0, ...queries.map((query) => query.fulfilledTimeStamp ?? 0));
  return <div className="flex flex-wrap items-end justify-between gap-3">
    <div><p className="eyebrow">{eyebrow}</p><h1 className="text-xl font-semibold">{title}</h1><p className="text-sm text-muted-foreground">{description}</p>
      <p role="status" className="text-xs text-muted-foreground">{fetching ? "Refreshing…" : updatedAgo(latest || undefined)}</p></div>
    <div className="flex flex-wrap items-center gap-2">{actions}
      {periods && onPeriod ? <div role="group" aria-label="Period" className="flex gap-1">{periods.map((item) => <Button key={item.value} type="button" size="sm" variant={period === item.value ? "default" : "outline"} aria-pressed={period === item.value} onClick={() => onPeriod(item.value)}>{item.label}</Button>)}</div> : null}
      <Button type="button" size="sm" variant="outline" disabled={fetching} onClick={() => { for (const query of queries) void query.refetch(); }}><RefreshCw className={fetching ? "animate-spin" : undefined} />Refresh</Button></div>
  </div>;
}

/**
 * Says so when no report could be read at all, or every report came back empty; otherwise shows the dashboard.
 * A dashboard with some reports missing is still shown, each card saying what it could not load.
 */
export function DashboardState({ queries, children }: { queries: readonly ReportQuery[]; children: ReactNode }) {
  const some = queries.some((query) => hasResults(query.data));
  if (!some && queries.some((query) => query.isLoading)) return <div role="status" aria-label="Loading the dashboard" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-lg bg-muted" />)}</div>;
  const failed = queries.find((query) => query.error);
  if (!some && failed) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h2 className="text-lg font-semibold">The dashboard could not be loaded</h2><p className="text-sm text-muted-foreground">{apiErrorMessage(failed.error)}</p>
    <Button type="button" size="sm" variant="outline" onClick={() => { for (const query of queries) void query.refetch(); }}>Retry</Button></div>;
  if (!some) return <div className="mx-auto max-w-md py-12 text-center"><h2 className="text-lg font-semibold">Nothing to show</h2><p className="text-sm text-muted-foreground">There are no figures for this period. Try another period.</p></div>;
  return <>{failed ? <p role="alert" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">Some figures could not be loaded. The cards that have them are still shown.</p> : null}{children}</>;
}

/** One headline figure. With `to` it links to the list the figure counts. */
export function MetricTile({ label, value, note, icon: Icon, to, loading = false, failed = false, tone = "none" }: { label: string; value: ReactNode; note?: string; icon?: LucideIcon; to?: string; loading?: boolean; failed?: boolean; tone?: "none" | "warning" | "danger" }) {
  const body = <><dt className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>{label}</span>{Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}</dt>
    <dd className={cn("mt-1 text-2xl font-semibold leading-tight", tone === "danger" && "text-destructive", tone === "warning" && "text-amber-700 dark:text-amber-400")}>{loading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-muted" /> : failed ? "–" : typeof value === "number" ? number(value) : value}</dd>
    <dd className="mt-0.5 text-xs text-muted-foreground">{failed ? "Could not be loaded" : note}</dd></>;
  return to ? <Link to={to} className="block min-w-0 ui-card border bg-card hover:border-primary focus-visible:outline-2">{body}</Link> : <div className="min-w-0 ui-card border bg-card">{body}</div>;
}
export function MetricGrid({ children, columns = "xl:grid-cols-4" }: { children: ReactNode; columns?: string }) {
  return <dl className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", columns)}>{children}</dl>;
}

/** A titled card of a dashboard, with its own loading, failed and empty states. */
export function DashboardCard({ title, note, query, empty = false, emptyMessage = "Nothing for this period.", action, className, children }: { title: string; note?: string; query?: Pick<ReportQuery, "isLoading" | "error" | "refetch"> | undefined;
  empty?: boolean; emptyMessage?: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return <section aria-label={title} className={cn("min-w-0 space-y-3 ui-card border bg-card", className)}>
    <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h2 className="text-sm font-semibold">{title}</h2>{note ? <p className="text-xs text-muted-foreground">{note}</p> : null}</div>{action}</div>
    {query?.isLoading ? <div role="status" aria-label={`Loading ${title.toLowerCase()}`} className="h-24 animate-pulse rounded-md bg-muted" />
      : query?.error ? <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive"><span>{apiErrorMessage(query.error)}</span><Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>
      : empty ? <p className="text-sm text-muted-foreground">{emptyMessage}</p> : children}
  </section>;
}

export interface BarItem { label: string; value: number; tone?: "primary" | "success" | "warning" | "danger" | "muted" | undefined; note?: string | undefined }
const tones: Record<NonNullable<BarItem["tone"]>, string> = { primary: "bg-primary", success: "bg-emerald-500", warning: "bg-amber-500", danger: "bg-destructive", muted: "bg-muted-foreground" };
/**
 * Counts side by side as bars, each with its number. `share` scales the bars against their total (parts of a whole);
 * otherwise against the largest (a comparison). This is what the charts of the web application show, as a list a
 * screen reader can read.
 */
export function BarList({ items, share = true, format = number }: { items: readonly BarItem[]; share?: boolean; format?: (value: number) => string }) {
  const scale = share ? items.reduce((sum, item) => sum + Math.max(0, item.value), 0) : Math.max(0, ...items.map((item) => item.value));
  return <ul className="space-y-2">{items.map((item) => { const width = scale > 0 ? Math.max(item.value > 0 ? 2 : 0, (Math.max(0, item.value) / scale) * 100) : 0;
    return <li key={item.label} className="space-y-1 text-sm"><div className="flex items-baseline justify-between gap-3"><span className="min-w-0 break-words">{item.label}{item.note ? <span className="text-xs text-muted-foreground"> · {item.note}</span> : null}</span><span className="shrink-0 font-medium">{format(item.value)}</span></div>
      <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", tones[item.tone ?? "primary"])} style={{ width: `${width}%` }} /></div></li>; })}</ul>;
}

/** A total with the rows that make it up. */
export function Breakdown({ total, rows }: { total: number; rows: readonly (readonly [string, number])[] }) {
  return <div className="space-y-2"><p className="text-2xl font-semibold">{number(total)}</p>
    <dl className="divide-y text-sm">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-3 py-1"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{number(value)}</dd></div>)}</dl></div>;
}

/** Two counts as parts of one bar: done against still to do. */
export function Split({ done, doneLabel, pending, pendingLabel }: { done: number; doneLabel: string; pending: number; pendingLabel: string }) {
  const total = done + pending;
  const share = total === 0 ? 0 : Math.round((done / total) * 100);
  return <div className="space-y-2"><div role="img" aria-label={`${share}% ${doneLabel}`} className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} /></div>
    <div className="flex justify-between text-sm"><span><span className="font-semibold">{number(done)}</span> {doneLabel}</span><span><span className="font-semibold">{number(pending)}</span> {pendingLabel}</span></div></div>;
}

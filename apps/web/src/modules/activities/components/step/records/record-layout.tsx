import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/shared/format/dates";

/** How a record's status reads at a glance: finished, still moving, or stopped. */
export type RecordTone = "done" | "waiting" | "problem";
const tones: Record<RecordTone, string> = {
  done: "border-emerald-500/60 text-emerald-700 dark:text-emerald-400",
  waiting: "border-amber-500/60 text-amber-700 dark:text-amber-400",
  problem: "border-destructive/60 text-destructive",
};
const empty = (value: ReactNode) => value === null || value === undefined || value === "" || value === false;

/** One recorded action: what it is, where it stands, and who recorded it. */
export function ActionRecord({ icon: Icon, title, code, status, tone, flags, recorded, batchScoped, children }: {
  icon: LucideIcon; title: string; code?: string | null | undefined;
  status?: string | null | undefined; tone?: RecordTone | undefined; flags?: readonly (string | false | null | undefined)[];
  recorded?: { at?: string | null | undefined; by?: string | null | undefined } | undefined;
  batchScoped: boolean; children: ReactNode;
}) {
  const when = recorded?.at ? formatDateTime(recorded.at) : null;
  const byline = [when ? `Recorded ${when}` : recorded?.by ? "Recorded" : null, recorded?.by ? `by ${recorded.by}` : null].filter(Boolean).join(" ");
  return <section aria-label={title} className="min-w-0 rounded-md border">
    <header className="flex min-w-0 items-start gap-3 p-3">
      <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"><Icon className="size-4" /></span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="min-w-0 break-words text-sm font-semibold">{title}</h3>
          {code ? <span className="min-w-0 text-sm tabular-nums text-muted-foreground [overflow-wrap:anywhere]">{code}</span> : null}
        </div>
        {byline || batchScoped ? <p className="break-words text-sm text-muted-foreground">
          {byline}{byline && batchScoped ? " · " : ""}{batchScoped ? "Linked to the batch, not specifically to this step" : ""}
        </p> : null}
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-1">
        {batchScoped ? <Badge variant="outline">Batch level</Badge> : null}
        {(flags ?? []).filter((flag): flag is string => Boolean(flag)).map((flag) => <Badge key={flag} variant="outline">{flag}</Badge>)}
        {status ? <Badge variant="outline" className={tone ? tones[tone] : undefined}>{status}</Badge> : null}
      </div>
    </header>
    <div className="min-w-0 space-y-3 border-t p-3">{children}</div>
  </section>;
}

export type RecordFigure = readonly [label: string, value: ReactNode, note?: ReactNode];
/** The few numbers that tell the story of a record, shown larger than its other details. */
export function RecordFigures({ figures }: { figures: readonly RecordFigure[] }) {
  const shown = figures.filter(([, value]) => !empty(value));
  if (!shown.length) return null;
  return <dl className="grid min-w-0 grid-cols-2 gap-2 lg:grid-cols-4">
    {shown.map(([label, value, note]) => <div key={label} className="min-w-0 rounded-md bg-muted/50 px-3 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-base font-semibold leading-tight tabular-nums [overflow-wrap:anywhere]">{value}</dd>
      {note ? <dd className="mt-0.5 text-sm text-muted-foreground">{note}</dd> : null}
    </div>)}
  </dl>;
}

export type RecordFact = readonly [label: string, value: ReactNode];
/** Supporting details. Fields that were never filled in are left out rather than shown as dashes. */
export function RecordFacts({ facts }: { facts: readonly RecordFact[] }) {
  const shown = facts.filter(([, value]) => !empty(value));
  if (!shown.length) return null;
  return <dl className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-2 xl:grid-cols-3">
    {shown.map(([label, value]) => <div key={label} className="min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm tabular-nums [overflow-wrap:anywhere]">{value}</dd>
    </div>)}
  </dl>;
}

export function RecordNote({ label, value }: { label: string; value: string | null | undefined }) {
  return value ? <p className="break-words whitespace-pre-wrap text-sm [overflow-wrap:anywhere]"><span className="text-muted-foreground">{label}: </span>{value}</p> : null;
}

/** Received against sent, as a bar and in words. */
export function RecordProgress({ label, done, total, text }: { label: string; done: number | null | undefined; total: number | null | undefined; text: string }) {
  if (done === null || done === undefined || !total || total <= 0) return null;
  const percent = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
  return <div className="min-w-0 space-y-1">
    <div className="flex items-baseline justify-between gap-2 text-sm"><span>{text}</span><span className="tabular-nums text-muted-foreground">{percent}%</span></div>
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={text}
      className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", percent >= 100 ? "bg-emerald-500" : "bg-primary")} style={{ width: `${percent}%` }} /></div>
  </div>;
}

export function RecordSubheading({ children }: { children: ReactNode }) {
  return <h4 className="text-sm font-medium">{children}</h4>;
}

/** What happened to the record, in order. A single event is already in the record's byline, so it needs no list. */
export function RecordTimeline({ events }: { events: readonly { label: string; at?: string | null | undefined; by?: string | null | undefined }[] }) {
  const recorded = events.filter((event) => event.at);
  if (recorded.length < 2) return null;
  return <div className="min-w-0 space-y-2"><RecordSubheading>History</RecordSubheading>
    <ol className="min-w-0 space-y-1.5">{recorded.map((event) => <li key={event.label} className="grid min-w-0 grid-cols-[0.5rem_minmax(7rem,auto)_minmax(0,1fr)] items-baseline gap-x-2 text-sm">
      <span aria-hidden className="size-1.5 translate-y-[-1px] rounded-full bg-primary" />
      <span className="font-medium">{event.label}</span>
      <span className="min-w-0 break-words text-muted-foreground">{formatDateTime(event.at)}{event.by ? ` · ${event.by}` : ""}</span>
    </li>)}</ol>
  </div>;
}

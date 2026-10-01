import type { ReactNode } from "react";
import { cn } from "cn";

/** One grey placeholder block. Size it with classes: `<Skeleton className="h-4 w-40" />`. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("block animate-pulse rounded bg-muted motion-reduce:animate-none", className)} />;
}

/** Wraps placeholders so assistive technology hears one "Loading …" instead of a pile of empty boxes. */
export function SkeletonRegion({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return <div role="status" aria-busy="true" aria-label={label} className={cn("min-w-0", className)}>
    <span className="sr-only">{label}</span>{children}
  </div>;
}

const widths = ["w-3/4", "w-1/2", "w-2/3", "w-5/6"] as const;

/** A card of label and value lines, shaped like a `DetailGroup`. */
export function DetailGroupSkeleton({ rows = 5 }: { rows?: number }) {
  return <div className="space-y-3 rounded-lg border bg-card p-4">
    <Skeleton className="h-4 w-32" />
    {Array.from({ length: rows }, (_, index) => <div key={index} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3">
      <Skeleton className="h-3.5 w-20" /><Skeleton className={cn("h-3.5", widths[index % widths.length])} />
    </div>)}
  </div>;
}

/** A card of form fields, shaped like one section of a `FormWizard` form. */
export function FormSectionSkeleton({ fields = 6, columns = "md:grid-cols-2 xl:grid-cols-3" }: { fields?: number; columns?: string }) {
  return <div className="space-y-3 rounded-lg border bg-card p-4">
    <Skeleton className="h-4 w-40" />
    <div className={cn("grid grid-cols-1 gap-4", columns)}>
      {Array.from({ length: fields }, (_, index) => <div key={index} className="space-y-2"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-9 w-full" /></div>)}
    </div>
  </div>;
}

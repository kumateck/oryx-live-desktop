import { DetailGroupSkeleton, FormSectionSkeleton, Skeleton, SkeletonRegion } from "./skeleton";

/** Placeholder for a record page: heading, summary groups, and a tabbed table. */
export function DetailPageSkeleton({ label, groups = 5 }: { label: string; groups?: number }) {
  return <SkeletonRegion label={label} className="space-y-5">
    <div className="space-y-2"><Skeleton className="h-4 w-56" /><Skeleton className="h-7 w-80 max-w-full" />
      <div className="flex gap-2"><Skeleton className="h-5 w-20 rounded-full" /><Skeleton className="h-5 w-28 rounded-full" /></div></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: groups }, (_, index) => <DetailGroupSkeleton key={index} />)}</div>
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap gap-5">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-4 w-24" />)}</div>
      {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-8 w-full" />)}
    </div>
  </SkeletonRegion>;
}

/** Placeholder for a form page made of sections. `sections` lists how many fields each section has. */
export function FormPageSkeleton({ label, sections = [6, 3, 5], columns }: { label: string; sections?: readonly number[]; columns?: string }) {
  return <SkeletonRegion label={label} className="space-y-4">
    {sections.map((fields, index) => <FormSectionSkeleton key={index} fields={fields} {...(columns ? { columns } : {})} />)}
    <div className="flex justify-end gap-2"><Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-32" /></div>
  </SkeletonRegion>;
}

/** Placeholder for the first paint of a workspace page while its code loads. */
export function PageSkeleton({ label = "Loading page" }: { label?: string }) {
  return <SkeletonRegion label={label} className="space-y-4">
    <div className="space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-6 w-56" /></div>
    <div className="space-y-2 rounded-lg border bg-card p-4">{Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-8 w-full" />)}</div>
  </SkeletonRegion>;
}

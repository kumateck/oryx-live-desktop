import { Skeleton, SkeletonRegion } from "@/shared/skeleton/skeleton";

export function ProductionReadinessSkeleton() {
  return <SkeletonRegion label="Generating production readiness report" className="space-y-3">
    <div className="flex justify-between gap-3"><Skeleton className="h-5 w-52" /><Skeleton className="h-5 w-32" /></div>
    <Skeleton className="h-4 w-64" />
    <div className="divide-y rounded-lg border">{[0, 1, 2].map((row) => <div key={row} className="space-y-3 p-3">
      <div className="grid grid-cols-3 gap-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
      <div className="grid grid-cols-7 gap-2">{[0, 1, 2, 3, 4, 5, 6].map((check) => <Skeleton key={check} className="h-4 w-full" />)}</div>
    </div>)}</div>
  </SkeletonRegion>;
}

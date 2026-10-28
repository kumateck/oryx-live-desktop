import type { ReactNode } from "react";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { ReportResults } from "@/shared/reports/report-results";
import type { ReportBook } from "@/shared/reports/report-data";
import type { ReadinessView } from "../schemas/production-readiness";
import { ProductionReadinessResults } from "./production-readiness-results";
import { ProductionReadinessSkeleton } from "./production-readiness-skeleton";

export function ReportSnapshot({ book, readiness, busy, production, actions }: {
  book: ReportBook | null; readiness: ReadinessView | undefined; busy: boolean; production: boolean; actions: ReactNode;
}) {
  if (busy) return production ? <ProductionReadinessSkeleton />
    : <div aria-label="Generating report" className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!book) return <p className="text-sm text-muted-foreground">Choose filters and generate a report to view, print or export the complete snapshot.</p>;
  if (readiness) return <ProductionReadinessResults book={book} view={readiness} actions={actions} />;
  return <ReportResults book={book} />;
}

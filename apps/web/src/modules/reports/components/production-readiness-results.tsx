import type { ReactNode } from "react";
import type { ReportBook } from "@/shared/reports/report-data";
import { ReportResults } from "@/shared/reports/report-results";
import { PrintHeader } from "@/shared/print/print-sheet";
import type { ReadinessView } from "../schemas/production-readiness";
import { ProductionReadinessView } from "./production-readiness-view";

export function ProductionReadinessResults({ book, view, actions }: { book: ReportBook; view: ReadinessView; actions: ReactNode }) {
  return <ReportResults book={book} actions={actions} compactActions printContent={<>
    <PrintHeader title={book.title} aside={<p>Generated {new Date(book.generatedAt).toLocaleString()}</p>} />
    {book.warnings.map((warning) => <p key={warning} className="print-note">{warning}</p>)}
    <ProductionReadinessView view={view} paper />
  </>}><ProductionReadinessView view={view} /></ReportResults>;
}

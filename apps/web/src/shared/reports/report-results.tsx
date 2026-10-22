import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { PrintButton } from "@/shared/print/print-button";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import type { ReportBook } from "./report-data";
import { ResultSheet } from "./report-sheet";
import { ReportPrint } from "./report-print";
export function ReportResults({ book }: { book: ReportBook }) {
  const user = useCurrentUser(); const guard = useRef(false); const [exporting, setExporting] = useState(false); const [error, setError] = useState("");
  const exportFile = async (csv = false) => {
    if (guard.current) return; guard.current = true; setExporting(true); setError("");
    try { if (csv) { const { exportReportCsv } = await import("./export-csv"); await exportReportCsv(book); } else { const { exportReportWorkbook } = await import("./export-workbook"); await exportReportWorkbook(book, user?.name ?? null); } }
    catch { setError("The spreadsheet could not be created. Try exporting again."); }
    finally { guard.current = false; setExporting(false); }
  };
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Generated {new Date(book.generatedAt).toLocaleString()}</p>
    <div className="flex gap-2"><Button variant="outline" disabled={exporting} onClick={() => void exportFile()}>{exporting ? "Exporting…" : "Export Excel"}</Button>
      <Button variant="outline" disabled={exporting} onClick={() => void exportFile(true)}>Export CSV</Button>
      <PrintButton preview={(close) => <PrintPreviewDialog title={book.title} onClose={close}><ReportPrint book={book} /></PrintPreviewDialog>} />
    </div></div>
    <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm">{book.filters.map((filter) => <div key={filter.label}><dt className="inline text-muted-foreground">{filter.label}: </dt><dd className="inline">{filter.value}</dd></div>)}</dl>
    {book.warnings.length ? <ul role="status" className="list-disc space-y-1 rounded-md border p-3 pl-7">{book.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
    {error ? <p role="alert" className="text-destructive">{error}</p> : null}
    {book.sheets.map((sheet) => <ResultSheet key={sheet.name} sheet={sheet} />)}
  </div>;
}

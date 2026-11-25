import { useEffect, useState } from "react";
import type { StockTrace } from "../schemas/stock-trace";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader } from "@/shared/print/print-sheet";
import { useStockPeriod } from "../hooks/use-stock-period";
import { useStockTrace } from "../hooks/use-stock-trace";
import { StockTraceDocument, stockReportTitles, type StockReportView } from "./stock-trace-print";
import type { MaterialHeader } from "./approved-material-detail";

/** Loads every section in one consistent snapshot; no paginated or partially loaded report is printable. */
export function StockReportPreview({ material, departmentId, view, search = "", onClose }: { material: MaterialHeader; departmentId: string; view: StockReportView; search?: string; onClose: () => void }) {
  const [since] = useStockPeriod();
  const query = useStockTrace(material.id, departmentId, material.kind, since, true);
  const [snapshot, setSnapshot] = useState<StockTrace | null>(null);
  useEffect(() => { if (query.data) setSnapshot((current) => current ?? query.data); }, [query.data]);
  return <PrintPreviewDialog title={`${stockReportTitles[view]} · ${material.name}`} ready={snapshot !== null} onClose={onClose}
    note={snapshot ? null : query.error ?? "Loading the complete stock snapshot…"}>
    {snapshot ? <StockTraceDocument data={snapshot} view={view} search={search} /> : <><PrintHeader title={stockReportTitles[view]} reference={material.code} />
    <PrintFacts facts={[{ label: "Material", value: material.name }, { label: "Material code", value: material.code }]} /></>}
  </PrintPreviewDialog>;
}

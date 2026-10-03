import { formatDate } from "@/shared/format/dates";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { toLargestUnit } from "@/shared/units/quantity";
import { requisitionTypeLabels, statusLabel } from "../lib/requisition-status";
import type { Requisition, RequisitionLine } from "../schemas/requisition-schema";

/** Remarks are stored as text that may carry markup; a printed document shows the words only. */
function plainText(html: string): string {
  return new DOMParser().parseFromString(html, "text/html").body.textContent?.trim() ?? "";
}

/** A requisition as a document: who asked, for what, and where each line stands. */
export function RequisitionPrint({ requisition, onClose }: { requisition: Requisition; onClose: () => void }) {
  const columns: PrintColumn<RequisitionLine>[] = [
    { id: "number", header: "#", cell: (_row, index) => index + 1, width: "6%" },
    { id: "code", header: "Code", cell: (row) => row.materialCode ?? "–", width: "16%" },
    { id: "material", header: "Material", cell: (row) => row.materialName },
    { id: "quantity", header: "Quantity", align: "right", cell: (row) => toLargestUnit(row.quantity, row.unit, "calculated")?.text ?? String(row.quantity) },
    { id: "status", header: "Status", cell: (row) => statusLabel(row.status, requisition.type) },
  ];
  const remarks = requisition.comments ? plainText(requisition.comments) : "";
  return <PrintPreviewDialog title={`Requisition ${requisition.code}`} onClose={onClose}>
    <PrintHeader title={`${requisitionTypeLabels[requisition.type]} requisition`} reference={requisition.code} />
    <PrintFacts facts={[{ label: "Requested by", value: requisition.requestedBy }, { label: "Department", value: requisition.department }, { label: "Requested on", value: formatDate(requisition.createdAt) },
      { label: "Needed by", value: formatDate(requisition.expectedDelivery) }, { label: "Status", value: statusLabel(requisition.status, requisition.type) }, { label: "For product", value: requisition.product }]} />
    {remarks ? <p className="print-note"><strong>Remarks:</strong> {remarks}</p> : null}
    <PrintTable columns={columns} rows={requisition.items} rowKey={(row) => row.id} empty="No materials on this requisition" />
    <PrintSignatures roles={["Requested by", "Approved by", "Received by"]} />
  </PrintPreviewDialog>;
}

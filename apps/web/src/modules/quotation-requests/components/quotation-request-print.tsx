import { formatDate } from "@/shared/format/dates";
import { SupplierPrintBlock } from "@/shared/procurement/supplier-print";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { toLargestUnit } from "@/shared/units/quantity";
import type { QuotationRequest, QuotationRequestLine } from "../schemas/quotation-request-schema";

const columns: PrintColumn<QuotationRequestLine>[] = [
  { id: "number", header: "#", cell: (_row, index) => index + 1, width: "6%" },
  { id: "material", header: "Material", cell: (row) => <>{row.materialName}<small>{row.materialCode ?? "No code"}</small></> },
  { id: "manufacturer", header: "Manufacturer", cell: (row) => row.manufacturer ?? "–" },
  { id: "quantity", header: "Quantity", align: "right", cell: (row) => toLargestUnit(row.quantity, row.unit, "calculated")?.text ?? String(row.quantity) },
  { id: "price", header: "Unit price", cell: () => "", width: "16%" },
  { id: "unit", header: "Priced per", cell: () => "", width: "12%" },
];

/** A paper copy of a quotation request, with blank columns for the supplier's prices. Printing it does not send it. */
export function QuotationRequestPrint({ request, onClose }: { request: QuotationRequest; onClose: () => void }) {
  return <PrintPreviewDialog title={`Quotation request · ${request.supplier.name}`} note="A paper copy. Printing does not send the request to the supplier." onClose={onClose}>
    <PrintHeader title="Quotation request" />
    <SupplierPrintBlock supplier={request.supplier} />
    <PrintFacts facts={[{ label: "Materials", value: String(request.items.length) }, { label: "Prices in", value: request.supplier.currency }, { label: "Sent on", value: formatDate(request.sentAt) }]} />
    <p className="print-note">Please quote your unit price for each material below, stating the unit the price is per, with availability, lead time and payment terms.</p>
    <PrintTable columns={columns} rows={request.items} rowKey={(row) => row.id} empty="No materials on this request" />
  </PrintPreviewDialog>;
}

import { formatDate } from "@/shared/format/dates";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { formatMoney } from "@/shared/procurement/price";
import { supplierTypeLabels } from "@/shared/procurement/supplier-type";
import { linesQuantity } from "../lib/invoice-totals";
import type { ShipmentInvoice, ShipmentInvoiceLine } from "../schemas/invoice-schema";
import { invoiceLinePrintColumns } from "./invoice-lines-table";

const specifications: PrintColumn<ShipmentInvoiceLine>[] = [
  { id: "code", header: "Code", cell: (row) => row.materialCode ?? "–", width: "15%" },
  { id: "material", header: "Material", cell: (row) => row.materialName },
  { id: "pharmacopoeia", header: "Pharmacopoeia", cell: (row) => row.pharmacopoeia ?? "–" },
  { id: "specification", header: "Specification number", cell: (row) => row.specification ?? "–" },
];

/** A supplier's invoice as a document: the supplier, the lines and what they come to, the specifications, and any reasons given. */
export function InvoicePrint({ invoice, onClose }: { invoice: ShipmentInvoice; onClose: () => void }) {
  const supplier = invoice.supplier;
  const reasons = invoice.items.filter((line) => line.reason);
  return <PrintPreviewDialog title={`Shipment invoice · ${invoice.code}`} onClose={onClose}>
    <PrintHeader title="Shipment invoice" reference={invoice.code} />
    <PrintFacts facts={[{ label: "Supplier", value: supplier.name }, { label: "Kind", value: supplier.type === null ? null : supplierTypeLabels[supplier.type] }, { label: "Contact person", value: supplier.contactPerson },
      { label: "Email", value: supplier.email }, { label: "Phone", value: supplier.contactNumber }, { label: "Address", value: supplier.address },
      { label: "Purchase orders", value: invoice.orders.join(", ") }, { label: "Recorded", value: formatDate(invoice.createdAt) }, { label: "Invoice value", value: invoice.total === null ? null : formatMoney(invoice.total, invoice.currency) }]} />
    <PrintTable caption="Invoice items" columns={invoiceLinePrintColumns(invoice.currency)} rows={invoice.items} rowKey={(row) => row.id} empty="No lines on this invoice"
      footer={<tr><td colSpan={5} style={{ textAlign: "right" }}>Total ({invoice.items.length} {invoice.items.length === 1 ? "item" : "items"})</td><td style={{ textAlign: "right" }}>{linesQuantity(invoice.items)}</td>
        <td style={{ textAlign: "right" }}>{invoice.total === null ? "–" : formatMoney(invoice.total, invoice.currency)}</td></tr>} />
    <PrintTable caption="Material specifications" columns={specifications} rows={invoice.items} rowKey={(row) => row.id} empty="No lines on this invoice" />
    {reasons.length > 0 ? <div className="print-note"><strong>Notes and reasons</strong>{reasons.map((line) => <div key={line.id}>{line.materialCode ?? line.materialName}: {line.reason}</div>)}</div> : null}
    <PrintSignatures roles={["Prepared by", "Approved by"]} />
  </PrintPreviewDialog>;
}

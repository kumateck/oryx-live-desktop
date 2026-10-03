import { chargeState, chargeStateLabels, chargeTotals, grandTotal } from "@/modules/billing-sheets/lib/billing-rules";
import type { BillingCharge, BillingSheet } from "@/modules/billing-sheets/schemas/billing-schema";
import { invoiceLinePrintColumns } from "@/modules/shipment-invoices/components/invoice-lines-table";
import { lineAmount, linesValue } from "@/modules/shipment-invoices/lib/invoice-totals";
import type { ShipmentInvoiceLine } from "@/modules/shipment-invoices/schemas/invoice-schema";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { formatMoney } from "@/shared/procurement/price";
import { shipmentStatusLabels } from "../lib/shipment-kinds";
import type { Shipment } from "../schemas/shipment-schema";

const chargeColumns: PrintColumn<BillingCharge>[] = [
  { id: "charge", header: "Charge", cell: (row) => row.name },
  { id: "amount", header: "Amount", align: "right", cell: (row) => formatMoney(row.amount, row.currency) },
  { id: "state", header: "Payment", cell: (row) => chargeStateLabels[chargeState(row)] },
];
const waybillColumns: PrintColumn<ShipmentInvoiceLine>[] = [
  { id: "code", header: "Code", cell: (row) => row.materialCode ?? "–", width: "11%" },
  { id: "material", header: "Material", cell: (row) => row.materialName },
  { id: "pharmacopoeia", header: "Pharmacopoeia", cell: (row) => row.pharmacopoeia ?? "–" },
  { id: "manufacturer", header: "Manufacturer", cell: (row) => row.manufacturer ?? "–" },
  { id: "expected", header: "Expected", align: "right", cell: (row) => lineAmount(row.expected, row.unit) },
  { id: "received", header: "Received", align: "right", cell: (row) => lineAmount(row.quantity, row.unit) },
];
const specificationColumns: PrintColumn<ShipmentInvoiceLine>[] = [
  { id: "code", header: "Code", cell: (row) => row.materialCode ?? "–", width: "15%" },
  { id: "material", header: "Material", cell: (row) => row.materialName },
  { id: "specification", header: "Specification number", cell: (row) => row.specification ?? "–" },
];
const preparedBy = (shipment: Shipment) => shipment.preparedBy ? <p className="print-note">Prepared by <strong>{shipment.preparedBy}</strong>{shipment.preparedByDepartment ? `, ${shipment.preparedByDepartment}` : ""}</p> : null;

/** A shipment document with its billing sheet: what was invoiced, the port charges, and what the delivery costs in all. */
export function ShipmentBillingPrint({ shipment, sheet, onClose }: { shipment: Shipment; sheet: BillingSheet | null; onClose: () => void }) {
  const invoice = shipment.invoice;
  const lines = invoice?.items ?? [];
  const currency = invoice?.currency ?? null;
  const total = invoice?.total ?? linesValue(lines);
  const charges = sheet?.charges ?? [];
  const grand = grandTotal(total, currency, charges);
  return <PrintPreviewDialog title={`Shipment document · ${shipment.code}`} note={sheet ? null : "This shipment has no billing sheet yet, so the document shows the invoice only."} onClose={onClose}>
    <PrintHeader title="Shipment document" reference={shipment.code} />
    <PrintFacts facts={[{ label: "Bill of lading", value: sheet?.billOfLading }, { label: "Supplier", value: invoice?.supplier.name }, { label: "Invoice number", value: invoice?.code },
      { label: "Invoice amount", value: total === null ? null : formatMoney(total, currency) }, { label: "Stage", value: shipmentStatusLabels[shipment.status] }, { label: "Created", value: formatDate(shipment.createdAt) }]} />
    <PrintTable caption="Materials" columns={invoiceLinePrintColumns(currency)} rows={lines} rowKey={(row) => row.id} empty="No materials recorded"
      footer={<tr><td colSpan={6} style={{ textAlign: "right" }}>Invoice total</td><td style={{ textAlign: "right" }}>{total === null ? "–" : formatMoney(total, currency)}</td></tr>} />
    {sheet ? <PrintTable caption="Additional charges" columns={chargeColumns} rows={charges} rowKey={(row) => row.id} empty="No charges on the billing sheet"
      footer={chargeTotals(charges).map((item) => <tr key={item.currency ?? "none"}><td style={{ textAlign: "right" }}>Charges total{item.currency ? ` (${item.currency})` : ""}</td><td style={{ textAlign: "right" }}>{formatMoney(item.total, item.currency)}</td><td /></tr>)} /> : null}
    <p className="print-note"><strong>Grand total (invoice and charges): </strong>{grand ? formatMoney(grand.total, grand.currency) : total === null ? "not available" : "not added, because the charges are in another currency than the invoice"}</p>
    {preparedBy(shipment)}
    <PrintSignatures roles={["Prepared by", "Approved by"]} />
  </PrintPreviewDialog>;
}

/** A waybill as a document: where the delivery stands, what it carries, and the specification each material is held to. */
export function WaybillPrint({ shipment, onClose }: { shipment: Shipment; onClose: () => void }) {
  const lines = shipment.invoice?.items ?? [];
  return <PrintPreviewDialog title={`Waybill · ${shipment.code}`} onClose={onClose}>
    <PrintHeader title="Waybill" reference={shipment.code} />
    <PrintFacts facts={[{ label: "Current stage", value: shipmentStatusLabels[shipment.status] }, { label: "Invoice", value: shipment.invoice?.code }, { label: "Supplier", value: shipment.invoice?.supplier.name },
      { label: "Arrival approved", value: shipment.approved ? "Yes" : "No" }, { label: "Transit started", value: formatDateTime(shipment.reached[3]) }, { label: "Arrived", value: formatDateTime(shipment.reached[4]) },
      { label: "Distribution completed", value: formatDateTime(shipment.distributedAt) }]} />
    <PrintTable caption="Materials" columns={waybillColumns} rows={lines} rowKey={(row) => row.id} empty="No materials recorded" />
    <PrintTable caption="Material specifications" columns={specificationColumns} rows={lines} rowKey={(row) => row.id} empty="No materials recorded" />
    {preparedBy(shipment)}
    <PrintSignatures roles={["Prepared by", "Approved by"]} />
  </PrintPreviewDialog>;
}

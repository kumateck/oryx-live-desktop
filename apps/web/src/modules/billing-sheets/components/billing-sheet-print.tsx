import { formatDate } from "@/shared/format/dates";
import { formatMoney } from "@/shared/procurement/price";
import { SupplierPrintBlock } from "@/shared/procurement/supplier-print";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { invoiceLinePrintColumns } from "@/modules/shipment-invoices/components/invoice-lines-table";
import { chargeState, chargeStateLabels, chargeTotals, grandTotal } from "../lib/billing-rules";
import type { BillingCharge, BillingSheet } from "../schemas/billing-schema";

const chargeColumns: PrintColumn<BillingCharge>[] = [
  { id: "number", header: "#", cell: (_row, index) => index + 1, width: "6%" },
  { id: "charge", header: "Charge", cell: (row) => row.name },
  { id: "state", header: "Payment", cell: (row) => chargeStateLabels[chargeState(row)] },
  { id: "amount", header: "Amount", align: "right", cell: (row) => formatMoney(row.amount, row.currency) },
];
/** A billing sheet as a document: the container, its free time, the charges and what the invoice carries. */
export function BillingSheetPrint({ sheet, onClose }: { sheet: BillingSheet; onClose: () => void }) {
  const grand = grandTotal(sheet.invoice?.total ?? null, sheet.invoice?.currency ?? null, sheet.charges);
  return <PrintPreviewDialog title={`Billing sheet · ${sheet.code}`} onClose={onClose}>
    <PrintHeader title="Billing sheet" reference={sheet.code} />
    {sheet.supplier ? <SupplierPrintBlock supplier={sheet.supplier} /> : null}
    <PrintFacts facts={[{ label: "Bill of lading", value: sheet.billOfLading }, { label: "Invoice", value: sheet.invoice?.code ?? sheet.invoiceCode }, { label: "Invoice amount", value: sheet.invoice && sheet.invoice.total !== null ? formatMoney(sheet.invoice.total, sheet.invoice.currency) : null }, { label: "Expected arrival", value: formatDate(sheet.arrival) },
      { label: "Free time", value: sheet.freeTimeDuration }, { label: "Free time ends", value: formatDate(sheet.freeTimeExpiry) }, { label: "Demurrage from", value: formatDate(sheet.demurrageStart) },
      { label: "Container", value: sheet.containerNumber }, { label: "Packages", value: [sheet.packages, sheet.packageStyle?.name].filter(Boolean).join(" · ") }, { label: "Package description", value: sheet.packageDescription }]} />
    <PrintTable caption="Charges" columns={chargeColumns} rows={sheet.charges} rowKey={(row) => row.id} empty="No charges on this sheet"
      footer={chargeTotals(sheet.charges).map((item) => <tr key={item.currency ?? "none"}><td colSpan={3} style={{ textAlign: "right" }}>Total{item.currency ? ` (${item.currency})` : ""}</td><td style={{ textAlign: "right" }}>{formatMoney(item.total, item.currency)}</td></tr>)} />
    {sheet.invoice ? <PrintTable caption="Materials on the invoice" columns={invoiceLinePrintColumns(sheet.invoice.currency)} rows={sheet.invoice.items} rowKey={(row) => row.id} empty="No materials recorded"
      footer={<tr><td colSpan={6} style={{ textAlign: "right" }}>Invoice total</td><td style={{ textAlign: "right" }}>{sheet.invoice.total === null ? "–" : formatMoney(sheet.invoice.total, sheet.invoice.currency)}</td></tr>} /> : null}
    <p className="print-note"><strong>Grand total (invoice and charges): </strong>{grand ? formatMoney(grand.total, grand.currency) : "not added, because the invoice and the charges are not in one currency"}</p>
    {sheet.preparedBy ? <p className="print-note">Prepared by <strong>{sheet.preparedBy}</strong>{sheet.preparedByDepartment ? `, ${sheet.preparedByDepartment}` : ""}</p> : null}
    <PrintSignatures roles={["Prepared by", "Checked by", "Approved by"]} />
  </PrintPreviewDialog>;
}

import { formatDate } from "@/shared/format/dates";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { formatMoney } from "@/shared/procurement/price";
import { chargeState, chargeStateLabels, paidTotals } from "../lib/billing-rules";
import type { BillingCharge, BillingSheet } from "../schemas/billing-schema";

const columns: PrintColumn<BillingCharge>[] = [
  { id: "number", header: "#", cell: (_row, index) => index + 1, width: "6%" },
  { id: "charge", header: "Billing", cell: (row) => row.name },
  { id: "state", header: "Payment", cell: (row) => chargeStateLabels[chargeState(row)] },
  { id: "amount", header: "Amount", align: "right", cell: (row) => formatMoney(row.amount, row.currency) },
];

/**
 * The note that goes to finance asking for a shipment's port charges to be paid: what the shipment is, each
 * charge and whether it is paid, and what is still to pay.
 */
export function ChargesPrint({ sheet, shipment, onClose }: { sheet: BillingSheet;
  shipment: { code: string; arrivedAt: string | null; supplier: string | null; invoiceCode: string | null; invoiceTotal: number | null; invoiceCurrency: string | null; products: readonly string[] }; onClose: () => void }) {
  const totals = paidTotals(sheet.charges);
  const outstanding = totals.filter((item) => item.outstanding > 0).map((item) => formatMoney(item.outstanding, item.currency)).join(" + ");
  return <PrintPreviewDialog title={`Shipment charges · ${shipment.code}`} onClose={onClose}>
    <PrintHeader title="Shipment charges" reference={shipment.code} />
    <PrintFacts facts={[{ label: "Date", value: formatDate(new Date().toISOString()) }, { label: "Bill of lading", value: sheet.billOfLading }, { label: "Container no. / size", value: sheet.containerNumber },
      { label: "Supplier", value: shipment.supplier }, { label: "Invoice no.", value: shipment.invoiceCode }, { label: "Invoice amount", value: shipment.invoiceTotal === null ? null : formatMoney(shipment.invoiceTotal, shipment.invoiceCurrency) },
      { label: "Packages", value: [sheet.packages, sheet.packageStyle?.name].filter(Boolean).join(" ") }, { label: "Products", value: shipment.products.length ? shipment.products.join(", ") : sheet.packageDescription }]} />
    <PrintTable caption="Billing" columns={columns} rows={sheet.charges} rowKey={(row) => row.id} empty="No charges on the billing sheet"
      footer={totals.map((item) => <tr key={item.currency ?? "none"}><td colSpan={3} style={{ textAlign: "right" }}>Total{item.currency ? ` (${item.currency})` : ""} · already paid {formatMoney(item.paid, item.currency)}</td>
        <td style={{ textAlign: "right" }}>{formatMoney(item.total, item.currency)}</td></tr>)} />
    <p className="print-note"><strong>NB:</strong> Container arrived on {formatDate(shipment.arrivedAt) ?? "a date not yet recorded"}. Free time ended on {formatDate(sheet.freeTimeExpiry) ?? "–"}. Demurrage started from {formatDate(sheet.demurrageStart) ?? "–"}.
      {" "}{outstanding ? <>Total amount to be paid now is <strong>{outstanding}</strong>.</> : "Every charge is paid."}</p>
    <PrintSignatures roles={["Prepared by", "Checked by", "Approved by"]} />
  </PrintPreviewDialog>;
}

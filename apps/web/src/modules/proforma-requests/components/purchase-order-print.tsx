import { formatDate } from "@/shared/format/dates";
import { formatMoney, formatUnitPrice } from "@/shared/procurement/price";
import { SupplierPrintBlock } from "@/shared/procurement/supplier-print";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import type { SupplierType } from "@/shared/procurement/supplier-type";
import { toLargestUnit } from "@/shared/units/quantity";
import type { PurchaseOrder, PurchaseOrderLine } from "../schemas/purchase-order-schema";

/**
 * An order's lines and value as a document. `title` names what the document is for. Printing it does not send it.
 * With `type`, the charges and total recorded when the order was finalised are shown, and lines to sign on.
 */
export function PurchaseOrderPrint({ order, title, type, onClose }: { order: PurchaseOrder; title: string; type?: SupplierType; onClose: () => void }) {
  const currency = order.supplier.currency;
  const columns: PrintColumn<PurchaseOrderLine>[] = [
    { id: "number", header: "#", cell: (_row, index) => index + 1, width: "6%" },
    { id: "material", header: "Material", cell: (row) => <>{row.materialName}<small>{row.materialCode ?? "No code"}</small></> },
    { id: "quantity", header: "Quantity", align: "right", cell: (row) => toLargestUnit(row.quantity, row.unit, "calculated")?.text ?? String(row.quantity) },
    { id: "price", header: "Unit price", align: "right", cell: (row) => formatUnitPrice(row.price, currency, row.priceUnit) },
    { id: "amount", header: "Amount", align: "right", cell: (row) => row.cost === null ? "–" : formatMoney(row.cost, currency) },
  ];
  return <PrintPreviewDialog title={`${title} · ${order.code}`} note="A paper copy. Printing does not send anything to the supplier." onClose={onClose}>
    <PrintHeader title={title} reference={order.code} />
    <SupplierPrintBlock supplier={order.supplier} />
    <PrintFacts facts={[{ label: "Awarded on", value: formatDate(order.createdAt) }, { label: "Currency", value: currency }, { label: "Proforma invoice", value: order.proformaNumber },
      { label: "Terms of payment", value: order.termsOfPayment }, { label: "Delivery mode", value: order.deliveryMode }, { label: "Delivery expected", value: formatDate(order.expectedDelivery ?? order.estimatedDelivery) }]} />
    <PrintTable columns={columns} rows={order.items} rowKey={(row) => row.id} empty="No lines on this order"
      footer={<>
        <tr><td colSpan={4} style={{ textAlign: "right" }}>{type === 0 ? "Total FOB value" : "Order value"}</td><td style={{ textAlign: "right" }}>{order.total === null ? "Not available" : formatMoney(order.total, currency)}</td></tr>
        {type === 0 && order.recorded.grandTotal !== null ? <><tr><td colSpan={4} style={{ textAlign: "right" }}>Insurance</td><td style={{ textAlign: "right" }}>{formatMoney(order.recorded.insurance, currency)}</td></tr>
          <tr><td colSpan={4} style={{ textAlign: "right" }}>Freight</td><td style={{ textAlign: "right" }}>{formatMoney(order.recorded.freightOrTax, currency)}</td></tr></> : null}
        {type === 1 && order.recorded.grandTotal !== null && order.recorded.freightOrTax !== null ? <tr><td colSpan={4} style={{ textAlign: "right" }}>Tax</td><td style={{ textAlign: "right" }}>{formatMoney(order.recorded.freightOrTax, currency)}</td></tr> : null}
        {type !== undefined && order.recorded.grandTotal !== null ? <tr><td colSpan={4} style={{ textAlign: "right" }}>{type === 0 ? "Total CIF value" : "Grand total"}</td><td style={{ textAlign: "right" }}>{formatMoney(order.recorded.grandTotal, currency)}</td></tr> : null}
      </>} />
    {type !== undefined && order.recorded.inWords ? <p className="print-note"><strong>Amount in words:</strong> {order.recorded.inWords}</p> : null}
    {type !== undefined ? <PrintSignatures roles={["Prepared by", "Checked by", "Approved by"]} /> : null}
  </PrintPreviewDialog>;
}

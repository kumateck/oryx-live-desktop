import { useMemo } from "react";
import { AttachmentList } from "@/shared/attachments/attachment-list";
import { BillingSheetStatus, ChargeStateBadge } from "@/modules/billing-sheets/components/billing-status";
import { useBillingSheet } from "@/modules/billing-sheets/hooks/use-billing-sheets";
import { chargeTotals } from "@/modules/billing-sheets/lib/billing-rules";
import type { BillingCharge } from "@/modules/billing-sheets/schemas/billing-schema";
import { PurchaseOrderLines } from "@/modules/proforma-requests/components/purchase-order-lines";
import { purchaseOrderSchema } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { useGetApiV1ProcurementPurchaseOrderByPurchaseOrderIdQuery } from "@/modules/purchase-orders/api/order-api";
import { OrderTerms, OrderTotals } from "@/modules/purchase-orders/components/order-terms";
import { audit as orderAudit } from "@/modules/purchase-orders/lib/purchase-order-access";
import { useGetApiV1RequisitionByRequisitionIdQuery } from "@/modules/requisitions/api/requisition-api";
import { RequisitionFacts } from "@/modules/requisitions/components/requisition-facts";
import { listAudit } from "@/modules/requisitions/lib/requisition-access";
import { requisitionSchema, type RequisitionLine } from "@/modules/requisitions/schemas/requisition-schema";
import { ShipmentStatusBadge } from "@/modules/shipment-documents/components/shipment-status-badge";
import { useShipment } from "@/modules/shipment-documents/hooks/use-shipments";
import type { ShipmentInvoiceLine } from "@/modules/shipment-invoices/schemas/invoice-schema";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { formatMoney } from "@/shared/procurement/price";
import { SupplierSummary } from "@/shared/procurement/supplier-summary";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { DetailState, quantity, queryState } from "./detail-state";

/** A purchase order as its approver reads it: who it is to, on what terms, the lines and what they come to. */
export function PurchaseOrderDetails({ id }: { id: string }) {
  const query = useGetApiV1ProcurementPurchaseOrderByPurchaseOrderIdQuery({ ...orderAudit, purchaseOrderId: id });
  const order = useMemo(() => { const parsed = purchaseOrderSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  return <DetailState {...queryState(query)} value={order} label="purchase order">{(value) => <div className="space-y-4">
    <SupplierSummary supplier={value.supplier} /><OrderTerms order={value} /><PurchaseOrderLines order={value} />
    <AttachmentList title="Attachments" files={value.attachments} />
    {value.supplier.type === null ? <p className="text-sm text-muted-foreground">The supplier's type is not recorded, so the charges cannot be laid out.</p> : <OrderTotals order={value} type={value.supplier.type} />}
  </div>}</DetailState>;
}

const requisitionColumn = dataTableColumns<RequisitionLine>();
const requisitionColumns = requisitionColumn.columns([
  requisitionColumn.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div><div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
  requisitionColumn.accessor("quantity", { header: "Requested", size: 180, cell: ({ row }) => quantity(row.original.quantity, row.original.unit) }),
]);
/** A stock or purchase requisition: who asked, for which product, and for how much of what. */
export function RequisitionDetails({ id }: { id: string }) {
  const query = useGetApiV1RequisitionByRequisitionIdQuery({ ...listAudit, requisitionId: id });
  const requisition = useMemo(() => { const parsed = requisitionSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  return <DetailState {...queryState(query)} value={requisition} label="requisition">{(value) => <div className="space-y-4">
    <RequisitionFacts requisition={value} />
    {value.comments ? <section className="space-y-1 rounded-lg border bg-card p-4"><h3 className="text-sm font-semibold">Remarks</h3><RichTextView html={value.comments} className="text-sm" /></section> : null}
    <ClientDataTable label="Requested materials" columns={requisitionColumns} rows={value.items} getRowId={(row) => row.id} fill={false} emptyTitle="No materials on this requisition" />
  </div>}</DetailState>;
}

const lineColumn = dataTableColumns<ShipmentInvoiceLine>();
const lineColumns = lineColumn.columns([
  lineColumn.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div>
    <div className="break-words text-xs text-muted-foreground">{[row.original.materialCode ?? "No code", row.original.order].filter(Boolean).join(" · ")}</div></div> }),
  lineColumn.accessor((row) => row.manufacturer ?? "", { id: "manufacturer", header: "Manufacturer", cell: ({ row }) => row.original.manufacturer ?? "–" }),
  lineColumn.accessor("expected", { header: "Expected", size: 150, cell: ({ row }) => quantity(row.original.expected, row.original.unit) }),
  lineColumn.accessor("quantity", { header: "Invoiced", size: 150, cell: ({ row }) => quantity(row.original.quantity, row.original.unit) }),
  lineColumn.accessor((row) => row.reason ?? "", { id: "reason", header: "Reason for difference", cell: ({ row }) => row.original.reason ?? "–" }),
]);
/** A delivery whose arrival is being approved: what it carried against what was expected. */
export function ShipmentDetails({ id }: { id: string }) {
  const state = useShipment("shipment", id);
  return <DetailState loading={state.loading} error={state.error} onRetry={state.retry} value={state.shipment} label="shipment">{(value) => <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2"><ShipmentStatusBadge status={value.status} /><span className="text-sm text-muted-foreground">Arrived {formatDateTime(value.reached[4]) ?? "on an unrecorded date"}</span></div>
    {value.invoice ? <><SupplierSummary supplier={value.invoice.supplier} />
      <DetailGroup title="Delivery"><DetailItem label="Document" value={value.code} /><DetailItem label="Invoice" value={value.invoice.code} /><DetailItem label="Purchase orders" value={value.invoice.orders.join(", ")} />
        <DetailItem label="Invoice value" value={value.invoice.total === null ? null : formatMoney(value.invoice.total, value.invoice.currency)} /></DetailGroup>
      <ClientDataTable label="Materials on this delivery" columns={lineColumns} rows={value.invoice.items} getRowId={(row) => row.id} fill={false} emptyTitle="No materials recorded" /></>
      : <p role="alert" className="text-sm">The invoice this delivery carries could not be read.</p>}
    <AttachmentList title="Shipping documents" files={value.attachments} />
  </div>}</DetailState>;
}

const chargeColumn = dataTableColumns<BillingCharge>();
const chargeColumns = chargeColumn.columns([
  chargeColumn.accessor("name", { header: "Charge", cell: ({ row }) => <span className="break-words font-medium">{row.original.name}</span> }),
  chargeColumn.accessor("amount", { header: "Amount", size: 200, cell: ({ row }) => formatMoney(row.original.amount, row.original.currency) }),
  chargeColumn.display({ id: "state", header: "Payment", size: 230, cell: ({ row }) => <ChargeStateBadge charge={row.original} /> }),
]);
/** A billing sheet: the container, its free time, and the charges the approver is agreeing to. */
export function BillingSheetDetails({ id }: { id: string }) {
  const state = useBillingSheet(id);
  return <DetailState loading={state.loading} error={state.error} onRetry={state.retry} value={state.sheet} label="billing sheet">{(value) => <div className="space-y-4">
    <BillingSheetStatus sheet={value} />
    {value.supplier ? <SupplierSummary supplier={value.supplier} /> : null}
    <div className="grid gap-3 lg:grid-cols-2">
      <DetailGroup title="Shipment"><DetailItem label="Bill of lading" value={value.billOfLading} /><DetailItem label="Invoice" value={value.invoice?.code ?? value.invoiceCode} /><DetailItem label="Expected arrival" value={formatDate(value.arrival)} />
        <DetailItem label="Free time" value={value.freeTimeDuration} /><DetailItem label="Free time ends" value={formatDate(value.freeTimeExpiry)} /><DetailItem label="Demurrage from" value={formatDate(value.demurrageStart)} /></DetailGroup>
      <DetailGroup title="Container"><DetailItem label="Container number" value={value.containerNumber} /><DetailItem label="Packages" value={[value.packages, value.packageStyle?.name].filter(Boolean).join(" · ")} />
        <DetailItem label="Description" value={value.packageDescription} /><DetailItem label="Payment due" value={formatDate(value.dueDate)} /></DetailGroup>
    </div>
    <ClientDataTable label="Charges" columns={chargeColumns} rows={value.charges} getRowId={(row) => row.id} fill={false} emptyTitle="No charges on this sheet" />
    <AttachmentList title="Supporting documents" files={value.attachments} />
    <p className="text-right text-sm font-semibold">{chargeTotals(value.charges).map((item) => `Total ${formatMoney(item.total, item.currency)}`).join(" · ")}</p>
  </div>}</DetailState>;
}

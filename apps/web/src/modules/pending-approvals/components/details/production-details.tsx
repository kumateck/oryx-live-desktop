import { useMemo } from "react";
import { z } from "zod";
import { productionApi } from "@/shared/api/generated/production";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { audit } from "../../lib/approval-documents";
import { DetailState, quantity, queryState } from "./detail-state";
import { countText } from "@/shared/packing/fg-quantity";
import { shipperSplit } from "@/shared/packing/packs";

const { useGetApiV1ProductionScheduleExtraPackingByProductionExtraPackingIdQuery, useGetApiV1ProductionScheduleFinishedGoodsTransferNoteByIdQuery, useGetApiV1ProductionOrdersByIdQuery,
  useGetApiV1ProductionOrdersProformaInvoiceByProformaInvoiceIdQuery, useGetApiV1ProductionOrdersAllocateByAllocateProductionOrderIdQuery } = productionApi;
const { useGetApiV1StockAdjustmentByIdQuery } = warehouseApi;

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : null);
const named = z.object({ name: text, code: text }).nullish();
const unit = z.object({ symbol: text }).nullish();
const number = (value: number | null) => value === null ? "–" : formatQuantityNumber(value, "calculated");
function useParsed<T>(schema: z.ZodType<T>, data: unknown): T | null {
  return useMemo(() => { const parsed = schema.safeParse(data ?? null); return parsed.success ? parsed.data : null; }, [schema, data]);
}

const extraSchema = z.object({ quantity: amount, uoM: unit, material: named, productionScheduleProduct: z.object({ product: named, batchNumber: text }).nullish(),
  batches: z.array(z.object({ quantityToTake: amount, batch: z.object({ batchNumber: text, expiryDate: z.string().nullish() }).nullish() })).nullish() });
type ExtraBatch = { key: string; number: string | null; take: number | null; expires: string | null };
const extraColumn = dataTableColumns<ExtraBatch>();
/** Extra material asked for on a batch already in production, and the stock it would be taken from. */
export function ExtraMaterialDetails({ id }: { id: string }) {
  const query = useGetApiV1ProductionScheduleExtraPackingByProductionExtraPackingIdQuery({ ...audit, productionExtraPackingId: id });
  const value = useParsed(extraSchema, query.data);
  const symbol = value?.uoM?.symbol ?? null;
  const columns = useMemo(() => extraColumn.columns([
    extraColumn.accessor((row) => row.number ?? "", { id: "batch", header: "Material batch", cell: ({ row }) => row.original.number ?? "No number" }),
    extraColumn.accessor((row) => row.take ?? 0, { id: "take", header: "To take", size: 180, cell: ({ row }) => quantity(row.original.take, symbol) }),
    extraColumn.accessor((row) => row.expires ?? "", { id: "expires", header: "Expires", size: 160, cell: ({ row }) => formatMonthYear(row.original.expires) ?? "–" }),
  ]), [symbol]);
  return <DetailState {...queryState(query)} value={value} label="extra material request">{(extra) => <div className="space-y-4">
    <DetailGroup title="Request"><DetailItem label="Product" value={extra.productionScheduleProduct?.product?.name} /><DetailItem label="Batch" value={extra.productionScheduleProduct?.batchNumber} />
      <DetailItem label="Material" value={[extra.material?.name, extra.material?.code].filter(Boolean).join(" · ")} /><DetailItem label="Extra quantity" value={quantity(extra.quantity, symbol)} /></DetailGroup>
    <ClientDataTable label="Stock to take it from" columns={columns} rows={(extra.batches ?? []).map((item, index) => ({ key: `b-${index}`, number: item.batch?.batchNumber ?? null, take: item.quantityToTake, expires: item.batch?.expiryDate ?? null }))}
      getRowId={(row) => row.key} fill={false} emptyTitle="No stock has been picked for this request" />
  </div>}</DetailState>;
}

const noteSchema = z.object({ transferNoteNumber: text, qarNumber: text, notes: text, quantityPerPack: amount, totalQuantity: amount, loose: amount, uoM: unit, fromWarehouse: named, toWarehouse: named, productPacking: named,
  batchManufacturingRecord: z.object({ batchNumber: text, manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish(), productionScheduleProduct: z.object({ product: named }).nullish() }).nullish() });
/** Finished goods being handed from production to the finished goods store. */
export function TransferNoteDetails({ id }: { id: string }) {
  const query = useGetApiV1ProductionScheduleFinishedGoodsTransferNoteByIdQuery({ ...audit, id });
  const value = useParsed(noteSchema, query.data);
  return <DetailState {...queryState(query)} value={value} label="transfer note">{(note) => { const record = note.batchManufacturingRecord; const symbol = note.uoM?.symbol;
    return <div className="grid gap-3 lg:grid-cols-2">
      <DetailGroup title="Transfer"><DetailItem label="Note number" value={note.transferNoteNumber} /><DetailItem label="QAR number" value={note.qarNumber} /><DetailItem label="From" value={note.fromWarehouse?.name} />
        <DetailItem label="To" value={note.toWarehouse?.name} /><DetailItem label="Notes" value={note.notes} /></DetailGroup>
      <DetailGroup title="Goods"><DetailItem label="Product" value={record?.productionScheduleProduct?.product?.name} /><DetailItem label="Batch" value={record?.batchNumber} />
        <DetailItem label="Manufactured" value={formatMonthYear(record?.manufacturingDate)} /><DetailItem label="Expires" value={formatMonthYear(record?.expiryDate)} /><DetailItem label="Packing" value={note.productPacking?.name} />
        <DetailItem label="Quantity per pack" value={number(note.quantityPerPack)} /><DetailItem label="Total quantity" value={[number(note.totalQuantity), symbol].filter(Boolean).join(" ")} /><DetailItem label="Loose" value={number(note.loose)} /></DetailGroup>
    </div>; }}</DetailState>;
}

const orderLine = z.object({ product: named, totalOrderQuantity: amount, unitPrice: amount, discountPercent: amount, totalValue: amount, productPacking: named });
const orderSchema = z.object({ code: text, totalValue: amount, promisedDeliveryDate: z.string().nullish(), createdAt: z.string().nullish(), customer: z.object({ name: text, email: text, phone: text, address: text }).nullish(), products: z.array(orderLine).nullish() });
type OrderLine = z.infer<typeof orderLine> & { key: string };
const orderColumn = dataTableColumns<OrderLine>();
const orderColumns = orderColumn.columns([
  orderColumn.accessor((row) => row.product?.name ?? "", { id: "product", header: "Product", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.product?.name ?? "Unnamed product"}</div>
    <div className="text-xs text-muted-foreground">{[row.original.product?.code, row.original.productPacking?.name].filter(Boolean).join(" · ") || "No code"}</div></div> }),
  orderColumn.accessor((row) => row.totalOrderQuantity ?? 0, { id: "quantity", header: "Quantity", size: 130, cell: ({ row }) => number(row.original.totalOrderQuantity) }),
  orderColumn.accessor((row) => row.unitPrice ?? 0, { id: "price", header: "Price per pack", size: 130, cell: ({ row }) => number(row.original.unitPrice) }),
  orderColumn.accessor((row) => row.discountPercent ?? 0, { id: "discount", header: "Discount", size: 110, cell: ({ row }) => row.original.discountPercent ? `${number(row.original.discountPercent)}%` : "–" }),
  orderColumn.accessor((row) => row.totalValue ?? 0, { id: "value", header: "Value", size: 150, cell: ({ row }) => <span className="font-medium">{number(row.original.totalValue)}</span> }),
]);
/** A customer's order for finished products: who for, what, at what price. */
export function ProductionOrderDetails({ id }: { id: string }) {
  const query = useGetApiV1ProductionOrdersByIdQuery({ ...audit, id });
  const value = useParsed(orderSchema, query.data);
  return <DetailState {...queryState(query)} value={value} label="production order">{(order) => <div className="space-y-4">
    <DetailGroup title="Order"><DetailItem label="Order number" value={order.code} /><DetailItem label="Customer" value={order.customer?.name} /><DetailItem label="Customer contact" value={[order.customer?.phone, order.customer?.email].filter(Boolean).join(" · ")} />
      <DetailItem label="Ordered on" value={formatDate(order.createdAt)} /><DetailItem label="Promised delivery" value={formatDate(order.promisedDeliveryDate)} /><DetailItem label="Order value" value={number(order.totalValue)} /></DetailGroup>
    <ClientDataTable label="Products ordered" columns={orderColumns} rows={(order.products ?? []).map((line, index) => ({ ...line, key: `p-${index}` }))} getRowId={(row) => row.key} fill={false} emptyTitle="No products on this order" />
  </div>}</DetailState>;
}

const share = z.object({ product: named, productPacking: z.object({ name: text, packPerShipper: z.number().nullish() }).nullish(), fulfilledQuantities: z.array(z.object({ quantity: amount, finishedGoodsTransferNote: z.object({ transferNoteNumber: text, batchManufacturingRecord: z.object({ batchNumber: text }).nullish() }).nullish() })).nullish() });
const allocationSchema = z.object({ invoiceCode: text, productionOrder: z.object({ code: text, customer: z.object({ name: text }).nullish(), promisedDeliveryDate: z.string().nullish() }).nullish(), products: z.array(share).nullish() });
type AllocationRow = { key: string; product: string; packing: string | null; perShipper: number; note: string | null; batch: string | null; quantity: number | null };
const allocationColumn = dataTableColumns<AllocationRow>();
const allocationColumns = allocationColumn.columns([
  allocationColumn.accessor("product", { header: "Product", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.product}</div><div className="text-xs text-muted-foreground">{row.original.packing ?? "Packing not recorded"}</div></div> }),
  allocationColumn.accessor((row) => row.note ?? "", { id: "note", header: "From transfer note", cell: ({ row }) => row.original.note ?? "–" }),
  allocationColumn.accessor((row) => row.batch ?? "", { id: "batch", header: "Batch", size: 160, cell: ({ row }) => row.original.batch ?? "–" }),
  // Packing lists count packs; the store reads them as shippers and loose packs.
  allocationColumn.accessor((row) => row.quantity ?? 0, { id: "quantity", header: "Allocated", size: 200, cell: ({ row }) => row.original.quantity === null ? "–"
    : <div><div className="font-medium">{countText({ ...shipperSplit(row.original.quantity, row.original.perShipper), units: 0 })}</div><div className="text-xs text-muted-foreground">{number(row.original.quantity)} packs</div></div> }),
]);
const allocationRows = (products: z.infer<typeof share>[] | null | undefined): AllocationRow[] => (products ?? []).flatMap((item, index) => { const base = { product: item.product?.name ?? "Unnamed product", packing: item.productPacking?.name ?? null, perShipper: item.productPacking?.packPerShipper ?? 0 };
  const taken = item.fulfilledQuantities ?? [];
  return taken.length === 0 ? [{ ...base, key: `a-${index}`, note: null, batch: null, quantity: null }]
    : taken.map((part, position) => ({ ...base, key: `a-${index}-${position}`, note: part.finishedGoodsTransferNote?.transferNoteNumber ?? null, batch: part.finishedGoodsTransferNote?.batchManufacturingRecord?.batchNumber ?? null, quantity: part.quantity })); });
function AllocationBody({ allocation }: { allocation: z.infer<typeof allocationSchema> }) {
  return <div className="space-y-4">
    <DetailGroup title="Order"><DetailItem label="Order number" value={allocation.productionOrder?.code} /><DetailItem label="Customer" value={allocation.productionOrder?.customer?.name} />
      <DetailItem label="Promised delivery" value={formatDate(allocation.productionOrder?.promisedDeliveryDate)} /><DetailItem label="Invoice" value={allocation.invoiceCode} /></DetailGroup>
    <ClientDataTable label="Finished goods allocated" columns={allocationColumns} rows={allocationRows(allocation.products)} getRowId={(row) => row.key} fill={false} emptyTitle="Nothing is allocated" />
  </div>;
}
/** Finished goods set aside for a customer's order: which batches, and how much of each. */
export function AllocationDetails({ id }: { id: string }) {
  const query = useGetApiV1ProductionOrdersAllocateByAllocateProductionOrderIdQuery({ ...audit, allocateProductionOrderId: id });
  const value = useParsed(allocationSchema, query.data);
  return <DetailState {...queryState(query)} value={value} label="allocation">{(allocation) => <AllocationBody allocation={allocation} />}</DetailState>;
}

const invoiceSchema = z.object({ code: text, allocateProductionOrder: allocationSchema.nullish(), products: z.array(z.object({ product: named, quantity: amount })).nullish() });
type InvoiceRow = { key: string; product: string; code: string | null; quantity: number | null };
const invoiceColumn = dataTableColumns<InvoiceRow>();
const invoiceColumns = invoiceColumn.columns([
  invoiceColumn.accessor("product", { header: "Product", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.product}</div><div className="text-xs text-muted-foreground">{row.original.code ?? "No code"}</div></div> }),
  invoiceColumn.accessor((row) => row.quantity ?? 0, { id: "quantity", header: "Quantity", size: 160, cell: ({ row }) => number(row.original.quantity) }),
]);
/** The proforma invoice raised to a customer for an order's allocated goods. */
export function ProformaInvoiceDetails({ id }: { id: string }) {
  const query = useGetApiV1ProductionOrdersProformaInvoiceByProformaInvoiceIdQuery({ ...audit, proformaInvoiceId: id });
  const value = useParsed(invoiceSchema, query.data);
  return <DetailState {...queryState(query)} value={value} label="proforma invoice">{(invoice) => <div className="space-y-4">
    <DetailGroup title="Invoice"><DetailItem label="Invoice number" value={invoice.code} /><DetailItem label="Order number" value={invoice.allocateProductionOrder?.productionOrder?.code} />
      <DetailItem label="Customer" value={invoice.allocateProductionOrder?.productionOrder?.customer?.name} /></DetailGroup>
    <ClientDataTable label="Products invoiced" columns={invoiceColumns} rows={(invoice.products ?? []).map((line, index) => ({ key: `i-${index}`, product: line.product?.name ?? "Unnamed product", code: line.product?.code ?? null, quantity: line.quantity }))}
      getRowId={(row) => row.key} fill={false} emptyTitle="No products on this invoice" />
  </div>}</DetailState>;
}

const adjustmentLine = z.object({ id: z.string().nullish(), itemName: text, itemCode: text, materialName: text, productName: text, batchNumber: text, shelfName: text, transferNoteNumber: text,
  physicalCount: amount, systemQuantitySnapshot: amount, variance: amount, uom: unit, reasonCode: text, notes: text });
const adjustmentSchema = z.object({ adjustmentNumber: text, adjustmentDate: z.string().nullish(), targetType: z.number().nullish(), lines: z.array(adjustmentLine).nullish() });
type AdjustmentLine = z.infer<typeof adjustmentLine> & { key: string };
const targets: Record<number, string> = { 0: "General store items", 1: "Materials", 2: "Finished products" };
const spaced = (value: string | null) => value ? value.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (letter) => letter.toUpperCase()) : "–";
const adjustmentColumn = dataTableColumns<AdjustmentLine>();
const adjustmentColumns = adjustmentColumn.columns([
  adjustmentColumn.display({ id: "stock", header: "Stock", cell: ({ row }) => { const line = row.original; return <div className="min-w-0"><div className="break-words font-medium">{line.materialName ?? line.productName ?? line.itemName ?? "Unnamed"}</div>
    <div className="break-words text-xs text-muted-foreground">{[line.itemCode, line.batchNumber ? `Batch ${line.batchNumber}` : null, line.shelfName ? `Shelf ${line.shelfName}` : null, line.transferNoteNumber].filter(Boolean).join(" · ") || "–"}</div></div>; } }),
  adjustmentColumn.accessor((row) => row.systemQuantitySnapshot ?? 0, { id: "system", header: "System", size: 140, cell: ({ row }) => quantity(row.original.systemQuantitySnapshot, row.original.uom?.symbol) }),
  adjustmentColumn.accessor((row) => row.physicalCount ?? 0, { id: "counted", header: "Counted", size: 140, cell: ({ row }) => quantity(row.original.physicalCount, row.original.uom?.symbol) }),
  adjustmentColumn.accessor((row) => row.variance ?? 0, { id: "variance", header: "Difference", size: 140, cell: ({ row }) => { const variance = row.original.variance;
    return <span className={variance !== null && variance < 0 ? "font-medium text-destructive" : "font-medium"}>{variance !== null && variance > 0 ? "+" : ""}{quantity(variance, row.original.uom?.symbol)}</span>; } }),
  adjustmentColumn.accessor((row) => row.reasonCode ?? "", { id: "reason", header: "Reason", cell: ({ row }) => <div className="min-w-0"><div>{spaced(row.original.reasonCode)}</div>{row.original.notes ? <div className="break-words text-xs text-muted-foreground">{row.original.notes}</div> : null}</div> }),
]);
/** A stock count that disagrees with the system: approving it changes the recorded stock to what was counted. */
export function StockAdjustmentDetails({ id }: { id: string }) {
  const query = useGetApiV1StockAdjustmentByIdQuery({ ...audit, id });
  const value = useParsed(adjustmentSchema, query.data);
  return <DetailState {...queryState(query)} value={value} label="stock adjustment">{(adjustment) => <div className="space-y-4">
    <DetailGroup title="Adjustment"><DetailItem label="Number" value={adjustment.adjustmentNumber} /><DetailItem label="Counted on" value={formatDate(adjustment.adjustmentDate)} />
      <DetailItem label="Stock" value={adjustment.targetType === null || adjustment.targetType === undefined ? null : targets[adjustment.targetType]} /></DetailGroup>
    <p role="note" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">Approving changes the recorded stock of each line to what was counted.</p>
    <ClientDataTable label="Lines" columns={adjustmentColumns} rows={(adjustment.lines ?? []).map((line, index) => ({ ...line, key: line.id ?? `l-${index}` }))} getRowId={(row) => row.key} fill={false} emptyTitle="No lines on this adjustment" />
  </div>}</DetailState>;
}

import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { formatMoney, formatUnitPrice } from "@/shared/procurement/price";
import { toLargestUnit } from "@/shared/units/quantity";
import type { PurchaseOrder, PurchaseOrderLine } from "../schemas/purchase-order-schema";

const column = dataTableColumns<PurchaseOrderLine>();

/** What a purchase order is for, line by line, with its value. */
export function PurchaseOrderLines({ order }: { order: PurchaseOrder }) {
  const currency = order.supplier.currency;
  const columns = column.columns([
    column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div>
      <div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
    column.accessor("quantity", { header: "Quantity", size: 140, cell: ({ row }) => toLargestUnit(row.original.quantity, row.original.unit, "calculated")?.text ?? String(row.original.quantity) }),
    column.display({ id: "price", header: "Unit price", size: 170, cell: ({ row }) => formatUnitPrice(row.original.price, currency, row.original.priceUnit) }),
    column.display({ id: "cost", header: "Amount", size: 170, cell: ({ row }) => row.original.cost === null ? <span className="text-destructive">Cannot be costed</span> : formatMoney(row.original.cost, currency) }),
  ]);
  return <div className="space-y-2">
    <ListDataTable label="Order lines" columns={columns} rows={order.items} getRowId={(row) => row.id} />
    <p className="flex justify-end gap-3 text-sm"><span className="text-muted-foreground">Order value</span>
      <span className="font-semibold">{order.total === null ? "Not available: a line has no usable price unit" : formatMoney(order.total, currency)}</span></p>
  </div>;
}

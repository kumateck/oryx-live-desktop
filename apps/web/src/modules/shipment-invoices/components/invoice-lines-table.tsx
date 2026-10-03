import { useMemo } from "react";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { formatMoney, formatUnitPrice } from "@/shared/procurement/price";
import type { PrintColumn } from "@/shared/print/print-sheet";
import { lineAmount, linesValue } from "../lib/invoice-totals";
import type { ShipmentInvoiceLine } from "../schemas/invoice-schema";

const column = dataTableColumns<ShipmentInvoiceLine>();

/**
 * The lines of a supplier's invoice wherever they are shown: on the invoice, its delivery and its billing sheet.
 * Each line says what was invoiced against what was left on the order, and what both are worth.
 */
export function InvoiceLinesTable({ label, lines, currency, showOrder = true }: { label: string; lines: readonly ShipmentInvoiceLine[]; currency: string | null; showOrder?: boolean }) {
  const columns = useMemo(() => column.columns([
    column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div>
      <div className="break-words text-xs text-muted-foreground">{[row.original.materialCode ?? "No code", showOrder ? row.original.order : null, formatUnitPrice(row.original.price, currency, row.original.priceUnit)].filter(Boolean).join(" · ")}</div></div> }),
    column.accessor((row) => row.manufacturer ?? "", { id: "manufacturer", header: "Manufacturer", cell: ({ row }) => row.original.manufacturer ?? <span className="text-muted-foreground">–</span> }),
    column.accessor("quantity", { header: "Quantity", size: 190, cell: ({ row }) => <div><div><span className="text-xs text-muted-foreground">Received </span><span className="font-medium">{lineAmount(row.original.quantity, row.original.unit)}</span></div>
      <div className="text-xs text-muted-foreground">Expected {lineAmount(row.original.expected, row.original.unit)}</div></div> }),
    column.accessor((row) => row.cost ?? 0, { id: "cost", header: "Cost", size: 190, cell: ({ row }) => <div><div><span className="text-xs text-muted-foreground">Received </span><span className="font-medium">{formatMoney(row.original.cost, currency)}</span></div>
      <div className="text-xs text-muted-foreground">Expected {formatMoney(row.original.expectedCost, currency)}</div></div> }),
    column.accessor((row) => row.reason ?? "", { id: "reason", header: "Reason", cell: ({ row }) => row.original.reason ?? <span className="text-muted-foreground">–</span> }),
  ]), [currency, showOrder]);
  const total = linesValue(lines);
  return <div className="space-y-2">
    <ClientDataTable label={label} columns={columns} rows={lines} getRowId={(row) => row.id} fill={false} emptyTitle="No materials recorded" />
    {lines.length > 0 ? <p className="text-right text-sm">{lines.length} {lines.length === 1 ? "material" : "materials"} · total <span className="font-semibold">{total === null ? "not available" : formatMoney(total, currency)}</span></p> : null}
  </div>;
}

/** The same lines for a printed document. */
export function invoiceLinePrintColumns(currency: string | null): PrintColumn<ShipmentInvoiceLine>[] {
  return [
    { id: "code", header: "Code", cell: (row) => row.materialCode ?? "–", width: "11%" },
    { id: "material", header: "Material", cell: (row) => <>{row.materialName}{row.order ? <small>{row.order}</small> : null}</> },
    { id: "manufacturer", header: "Manufacturer", cell: (row) => row.manufacturer ?? "–" },
    { id: "expected", header: "Expected", align: "right", cell: (row) => lineAmount(row.expected, row.unit) },
    { id: "price", header: "Unit price", align: "right", cell: (row) => formatUnitPrice(row.price, currency, row.priceUnit) },
    { id: "received", header: "Received", align: "right", cell: (row) => lineAmount(row.quantity, row.unit) },
    { id: "cost", header: "Total", align: "right", cell: (row) => formatMoney(row.cost, currency) },
  ];
}

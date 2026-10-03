import { createContext, useContext, useMemo } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditableComboboxCell, EditableNumberCell, EditableTextCell, ListDataTable, dataTableColumns } from "@/shared/datatable";
import { formatMoney, formatUnitPrice } from "@/shared/procurement/price";
import { toLargestUnit } from "@/shared/units/quantity";
import { invoiceLineCost, storedQuantity, type InvoiceLine } from "../lib/invoice-lines";

interface Editing { invalid: ReadonlySet<string>; currency: string | null; disabled: boolean; onChange: (key: string, change: Partial<Pick<InvoiceLine, "quantity" | "manufacturerId" | "reason" | "included">>) => void }
// The cells read what is being edited from here, so the columns never change and a field keeps focus while another line changes.
const EditingContext = createContext<Editing | null>(null);
function useEditing(): Editing {
  const editing = useContext(EditingContext);
  if (!editing) throw new Error("Invoice cells must be rendered inside InvoiceLinesEditor");
  return editing;
}
const amount = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);

function QuantityCell({ line }: { line: InvoiceLine }) {
  const { invalid, disabled, onChange } = useEditing();
  if (!line.included) return <span className="text-muted-foreground">Left off</span>;
  return <div className="flex items-center gap-2"><EditableNumberCell label={`Quantity of ${line.materialName} on ${line.orderCode}`} value={line.quantity} min={0} disabled={disabled} invalid={invalid.has(line.key)}
    onCommit={(quantity) => onChange(line.key, { quantity })} /><span className="shrink-0 text-sm text-muted-foreground">{line.enteredUnit}</span></div>;
}
function ManufacturerCell({ line }: { line: InvoiceLine }) {
  const { invalid, disabled, onChange } = useEditing();
  if (!line.included) return <span className="text-muted-foreground">–</span>;
  if (line.manufacturers.length === 0) return <span className="text-sm text-destructive">None set up for this supplier and material</span>;
  return <EditableComboboxCell label={`Manufacturer of ${line.materialName} on ${line.orderCode}`} value={line.manufacturerId} options={line.manufacturers} disabled={disabled} invalid={invalid.has(line.key) && !line.manufacturerId}
    placeholder="Select a manufacturer" onCommit={(manufacturerId) => onChange(line.key, { manufacturerId })} />;
}
function ReasonCell({ line }: { line: InvoiceLine }) {
  const { invalid, disabled, onChange } = useEditing();
  const quantity = storedQuantity(line);
  if (!line.included) return <span className="text-muted-foreground">–</span>;
  // Asked for only when less than what is left is invoiced.
  if (quantity === null || quantity >= line.remaining) return <span className="text-muted-foreground">Not needed</span>;
  return <EditableTextCell label={`Reason for ${line.materialName} on ${line.orderCode}`} value={line.reason} disabled={disabled} invalid={invalid.has(line.key) && !line.reason.trim()} placeholder="Why less than what is left"
    onCommit={(reason) => onChange(line.key, { reason })} />;
}
function CostCell({ line }: { line: InvoiceLine }) {
  const { currency } = useEditing();
  return line.included ? <span>{formatMoney(invoiceLineCost(line), currency)}</span> : <span className="text-muted-foreground">–</span>;
}
function IncludeCell({ line }: { line: InvoiceLine }) {
  const { disabled, onChange } = useEditing();
  return line.included ? <Button type="button" size="icon-sm" variant="ghost" aria-label={`Leave ${line.materialName} on ${line.orderCode} off the invoice`} disabled={disabled} onClick={() => onChange(line.key, { included: false })}><Trash2 /></Button>
    : <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => onChange(line.key, { included: true })}><RotateCcw />Keep</Button>;
}

const column = dataTableColumns<InvoiceLine>();
function buildColumns(currency: string | null) {
  return column.columns([
    column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div>
      <div className="break-words text-xs text-muted-foreground">{row.original.orderCode} · {formatUnitPrice(row.original.price, currency, row.original.priceUnit)}</div></div> }),
    column.display({ id: "left", header: "Left to invoice", size: 220, cell: ({ row }) => <div><div>{amount(row.original.remaining, row.original.unit)}</div>
      <div className="text-xs text-muted-foreground">{amount(row.original.ordered, row.original.unit)} ordered · {amount(row.original.invoiced, row.original.unit)} already invoiced</div></div> }),
    column.display({ id: "quantity", header: "Invoiced now", size: 200, cell: ({ row }) => <QuantityCell line={row.original} /> }),
    column.display({ id: "manufacturer", header: "Manufacturer", size: 240, cell: ({ row }) => <ManufacturerCell line={row.original} /> }),
    column.display({ id: "reason", header: "Reason", size: 220, cell: ({ row }) => <ReasonCell line={row.original} /> }),
    column.display({ id: "cost", header: "Amount", size: 150, cell: ({ row }) => <CostCell line={row.original} /> }),
    column.display({ id: "include", size: 90, header: () => <span className="sr-only">Keep or leave off</span>, cell: ({ row }) => <IncludeCell line={row.original} /> }),
  ]);
}

/** The lines being invoiced: how much of each, who made it, and why if it is less than what is left. */
export function InvoiceLinesEditor({ lines, invalid, currency, disabled, onChange }: { lines: readonly InvoiceLine[] } & Editing) {
  const editing = useMemo(() => ({ invalid, currency, disabled, onChange }), [invalid, currency, disabled, onChange]);
  const columns = useMemo(() => buildColumns(currency), [currency]);
  return <EditingContext.Provider value={editing}><ListDataTable label="Invoice lines" columns={columns} rows={lines} getRowId={(row) => row.key} emptyTitle="Choose purchase orders to see their lines" /></EditingContext.Provider>;
}

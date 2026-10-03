import { createContext, useContext, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditableNumberCell, EditableSelectCell, ListDataTable, dataTableColumns } from "@/shared/datatable";
import { formatQuantityNumber, relatedUnits, toLargestUnit } from "@/shared/units/quantity";
import { shortOfMaximum, type OrderLine } from "../lib/order-lines";

interface Editing { invalid: ReadonlySet<string>; onlyLine: boolean; onChange: (id: string, change: Partial<Pick<OrderLine, "quantity" | "enteredUnit">>) => void; onRemove: (id: string) => void }
// The cells read what is being edited from here, so the columns never change and a field keeps focus while another line's error clears.
const EditingContext = createContext<Editing | null>(null);
function useEditing(): Editing {
  const editing = useContext(EditingContext);
  if (!editing) throw new Error("Order line cells must be rendered inside OrderLinesTable");
  return editing;
}

function QuantityCell({ line }: { line: OrderLine }) {
  const { invalid, onChange } = useEditing();
  return <EditableNumberCell label={`Order quantity of ${line.name}`} value={line.quantity} min={0} invalid={invalid.has(line.id)} onCommit={(quantity) => onChange(line.id, { quantity })} />;
}
function UnitCell({ line }: { line: OrderLine }) {
  const { onChange } = useEditing();
  const units = relatedUnits(line.unit);
  return units.length > 1 ? <EditableSelectCell label={`Unit for ${line.name}`} value={line.enteredUnit} options={units.map((unit) => ({ value: unit, label: unit }))}
    onCommit={(enteredUnit) => onChange(line.id, { enteredUnit })} /> : <span>{line.enteredUnit || "–"}</span>;
}
function RemoveCell({ line }: { line: OrderLine }) {
  const { onlyLine, onRemove } = useEditing();
  return <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove ${line.name}`} disabled={onlyLine} onClick={() => onRemove(line.id)}><Trash2 /></Button>;
}

const column = dataTableColumns<OrderLine>();
const columns = column.columns([
  column.accessor("name", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.name}</div>
    <div className="text-xs text-muted-foreground">{row.original.code ?? "No code"}</div></div> }),
  column.accessor("stock", { header: "In warehouse", size: 150, cell: ({ row }) => toLargestUnit(row.original.stock, row.original.unit, "calculated")?.text ?? String(row.original.stock) }),
  column.display({ id: "short", header: "Short of maximum", size: 170, cell: ({ row }) => { const short = shortOfMaximum(row.original);
    return short === null ? <span className="text-muted-foreground">–</span> : `${formatQuantityNumber(short, "calculated")} ${row.original.enteredUnit}`; } }),
  column.display({ id: "quantity", header: "Order quantity", size: 170, cell: ({ row }) => <QuantityCell line={row.original} /> }),
  column.display({ id: "unit", header: "Unit", size: 120, cell: ({ row }) => <UnitCell line={row.original} /> }),
  column.display({ id: "remove", size: 56, header: () => <span className="sr-only">Remove</span>, cell: ({ row }) => <RemoveCell line={row.original} /> }),
]);

/** The materials being requisitioned, each with the quantity to order. */
export function OrderLinesTable({ lines, invalid, onChange, onRemove }: { lines: readonly OrderLine[] } & Omit<Editing, "onlyLine">) {
  const editing = useMemo(() => ({ invalid, onChange, onRemove, onlyLine: lines.length === 1 }), [invalid, onChange, onRemove, lines.length]);
  return <EditingContext.Provider value={editing}><ListDataTable label="Materials to order" columns={columns} rows={lines} getRowId={(row) => row.id} /></EditingContext.Provider>;
}

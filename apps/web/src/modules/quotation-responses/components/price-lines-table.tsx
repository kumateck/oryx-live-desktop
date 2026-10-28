import { createContext, useContext, useMemo } from "react";
import { TriangleAlert } from "lucide-react";
import { EditableNumberCell, EditableSelectCell, ListDataTable, dataTableColumns } from "@/shared/datatable";
import { formatMoney, formatUnitPrice, isNegligibleLine, lineCost } from "@/shared/procurement/price";
import { purchaseUnitOptions } from "@/shared/procurement/purchase-units";
import { useMaterialPurchaseUnitsQuery } from "@/shared/reference-data/material-purchase-units";
import { convertUnit, relatedUnits, toLargestUnit } from "@/shared/units/quantity";
import type { PriceLine } from "../lib/price-lines";

interface Editing {
  currency: string | null; invalid: ReadonlyMap<string, "price" | "priceUnit">; disabled: boolean;
  /** Lines that can only be read: already awarded or closed. */
  locked?: ReadonlySet<string> | undefined;
  /** Null when the prices are only being viewed. */
  onChange: ((id: string, update: Partial<Pick<PriceLine, "price" | "priceUnit">>) => void) | null;
}
// The cells read what is being edited from here, so the columns never change and a field keeps focus while another line's error clears.
const EditingContext = createContext<Editing | null>(null);
function useEditing(): Editing {
  const editing = useContext(EditingContext);
  if (!editing) throw new Error("Price cells must be rendered inside PriceLinesTable");
  return editing;
}

function PriceCell({ line }: { line: PriceLine }) {
  const { currency, invalid, disabled, locked, onChange } = useEditing();
  return onChange && !locked?.has(line.id) ? <EditableNumberCell label={`Unit price of ${line.materialName}`} value={line.price} min={0} disabled={disabled} invalid={invalid.get(line.id) === "price"}
    {...(currency ? { prefix: currency } : {})} onCommit={(price) => onChange(line.id, { price })} /> : <span>{formatUnitPrice(line.price, currency, null)}</span>;
}
function PriceUnitCell({ line }: { line: PriceLine }) {
  const { invalid, disabled, locked, onChange } = useEditing();
  const linked = useMaterialPurchaseUnitsQuery({ materialId: line.materialId ?? "", module: "Procurement", subModule: "Quotation responses" }, { skip: !line.materialId || !onChange });
  const offered = purchaseUnitOptions(linked.currentData ?? []);
  const units = offered.length ? offered.map((unit) => unit.value).filter((symbol) => convertUnit(1, line.unit, symbol) !== null) : relatedUnits(line.unit);
  return onChange && !locked?.has(line.id) && units.length > 1 ? <EditableSelectCell label={`Unit ${line.materialName} is priced per`} value={line.priceUnit || null} disabled={disabled} invalid={invalid.get(line.id) === "priceUnit"}
    options={units.map((unit) => ({ value: unit, label: unit }))} placeholder="Unit" onCommit={(priceUnit) => onChange(line.id, { priceUnit })} /> : <span>{line.priceUnit || "–"}</span>;
}
function ValueCell({ line }: { line: PriceLine }) {
  const { currency } = useEditing();
  const value = lineCost(line);
  const tiny = isNegligibleLine(line);
  return value === null ? <span className="text-muted-foreground">–</span> : <span className={tiny ? "flex items-center gap-1 text-destructive" : undefined}>
    {formatMoney(value, currency)}{tiny ? <><TriangleAlert className="size-3.5" /><span className="text-xs">Check the unit</span></> : null}</span>;
}

const column = dataTableColumns<PriceLine>();
const columns = column.columns([
  column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div>
    <div className="break-words text-xs text-muted-foreground">{row.original.manufacturer ? `Made by ${row.original.manufacturer}` : "No default manufacturer"}</div></div> }),
  column.accessor("quantity", { header: "Quantity", size: 130, cell: ({ row }) => toLargestUnit(row.original.quantity, row.original.unit, "calculated")?.text ?? String(row.original.quantity) }),
  column.display({ id: "price", header: "Unit price", size: 170, cell: ({ row }) => <PriceCell line={row.original} /> }),
  column.display({ id: "priceUnit", header: "Priced per", size: 130, cell: ({ row }) => <PriceUnitCell line={row.original} /> }),
  column.display({ id: "value", header: "Line value", size: 190, cell: ({ row }) => <ValueCell line={row.original} /> }),
]);

/** The quoted materials with the price for each. */
export function PriceLinesTable({ lines, currency, invalid, disabled, locked, onChange }: { lines: readonly PriceLine[] } & Editing) {
  const editing = useMemo(() => ({ currency, invalid, disabled, locked, onChange }), [currency, invalid, disabled, locked, onChange]);
  return <EditingContext.Provider value={editing}><ListDataTable label="Quoted prices" columns={columns} rows={lines} getRowId={(row) => row.id} /></EditingContext.Provider>;
}

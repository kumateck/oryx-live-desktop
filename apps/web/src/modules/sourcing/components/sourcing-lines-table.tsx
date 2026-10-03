import { createContext, useContext, useMemo } from "react";
import type { RequisitionLine } from "@/modules/requisitions/schemas/requisition-schema";
import { EditableMultiSelectCell, EditableSelectCell, ListDataTable, dataTableColumns } from "@/shared/datatable";
import { supplierTypeLabels, type SupplierType } from "@/shared/procurement/supplier-type";
import { toLargestUnit } from "@/shared/units/quantity";
import { useMaterialSuppliers } from "../hooks/use-material-suppliers";
import { noChoice, type SourcingChoice, type SourcingChoices } from "../lib/sourcing";

interface Editing { choices: SourcingChoices; invalid: ReadonlySet<string>; disabled: boolean; onChange: (lineId: string, choice: SourcingChoice) => void }
// The cells read what is being edited from here, so the columns never change and an open picker is not torn down by its own change.
const EditingContext = createContext<Editing | null>(null);
function useEditing(): Editing {
  const editing = useContext(EditingContext);
  if (!editing) throw new Error("Sourcing cells must be rendered inside SourcingLinesTable");
  return editing;
}

const sourceOptions = ([0, 1] as const).map((type) => ({ value: String(type), label: supplierTypeLabels[type] }));

function SourceCell({ line }: { line: RequisitionLine }) {
  const { choices, disabled, onChange } = useEditing();
  const choice = choices[line.id] ?? noChoice;
  return <EditableSelectCell label={`Where to buy ${line.materialName}`} value={choice.source === null ? null : String(choice.source)} options={sourceOptions} disabled={disabled} placeholder="Foreign or local"
    // Suppliers belong to one type, so changing it clears the ones chosen under the other.
    onCommit={(value) => { const source = (value === "1" ? 1 : 0) satisfies SupplierType; if (source !== choice.source) onChange(line.id, { source, suppliers: [] }); }} />;
}

function SupplierCell({ line }: { line: RequisitionLine }) {
  const { choices, invalid, disabled, onChange } = useEditing();
  const choice = choices[line.id] ?? noChoice;
  const suppliers = useMaterialSuppliers(line.materialId, choice.source);
  if (choice.source === null) return <span className="text-sm text-muted-foreground">Choose where to buy first</span>;
  if (suppliers.error) return <span role="alert" className="text-sm text-destructive">{suppliers.error}</span>;
  return <EditableMultiSelectCell label={`Suppliers for ${line.materialName}`} values={choice.suppliers} options={suppliers.options} loading={suppliers.loading} disabled={disabled} invalid={invalid.has(line.id)}
    placeholder="Select suppliers" emptyText={`No ${supplierTypeLabels[choice.source].toLowerCase()} supplier is set up for this material`} onCommit={(chosen) => onChange(line.id, { ...choice, suppliers: chosen })} />;
}

const column = dataTableColumns<RequisitionLine>();
const columns = column.columns([
  column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div>
    <div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
  column.accessor("quantity", { header: "Quantity", size: 150, cell: ({ row }) => toLargestUnit(row.original.quantity, row.original.unit, "calculated")?.text ?? String(row.original.quantity) }),
  column.display({ id: "source", header: "Buy from", size: 170, cell: ({ row }) => <SourceCell line={row.original} /> }),
  column.display({ id: "suppliers", header: "Suppliers to ask", size: 360, cell: ({ row }) => <SupplierCell line={row.original} /> }),
]);

/** The materials still to be sourced: for each, where it is bought and which suppliers are asked to quote. */
export function SourcingLinesTable({ lines, choices, invalid, disabled, onChange }: { lines: readonly RequisitionLine[] } & Editing) {
  const editing = useMemo(() => ({ choices, invalid, disabled, onChange }), [choices, invalid, disabled, onChange]);
  return <EditingContext.Provider value={editing}><ListDataTable label="Materials to source" columns={columns} rows={lines} getRowId={(row) => row.id} /></EditingContext.Provider>;
}

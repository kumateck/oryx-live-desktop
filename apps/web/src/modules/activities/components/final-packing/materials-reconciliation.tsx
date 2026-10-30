import { createContext, useContext, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { EditableNumberCell, ListDataTable, dataTableColumns } from "@/shared/datatable";
import { fromSmallestUnit, toLargestUnit } from "@/shared/units/quantity";
import { emptyEntry, materialFigures, type MaterialEntry, type PackingMaterial } from "../../lib/final-packing";

const show = (value: number, unit: string) => toLargestUnit(value, unit, "calculated")?.text ?? "–";

interface Editing {
  entries: Readonly<Record<string, MaterialEntry>>;
  showProblems: boolean;
  disabled: boolean;
  onChange: (materialId: string, patch: Partial<MaterialEntry>) => void;
}
// The cells read the entries from here, so the columns never change. Rebuilt columns remount every
// cell, which took focus out of the reason box after each character.
const EditingContext = createContext<Editing | null>(null);
function useEntry(material: PackingMaterial) {
  const editing = useContext(EditingContext);
  if (!editing) throw new Error("Reconciliation cells must be rendered inside MaterialsReconciliation");
  const entry = editing.entries[material.materialId] ?? emptyEntry;
  return { ...editing, entry, figures: materialFigures(material, entry) };
}

function MaterialCell({ material }: { material: PackingMaterial }) {
  const { entry, figures, showProblems, disabled, onChange } = useEntry(material);
  return <div className="min-w-0 space-y-1"><div className="break-words font-medium">{material.name}</div>
    <div className="text-xs text-muted-foreground">{material.code || "No code"} · in {material.displayUnit || "units"}</div>
    {figures.needsReason ? <Textarea rows={2} aria-label={`Reason for the loss of ${material.name}`} placeholder="Reason for the loss" value={entry.reason} disabled={disabled}
      onChange={(event) => onChange(material.materialId, { reason: event.target.value })} /> : null}
    {showProblems && figures.problem ? <p role="alert" className="text-xs text-destructive">{figures.problem}</p> : null}</div>;
}
function QuantityCell({ material, field, label }: { material: PackingMaterial; field: "packed" | "rejected" | "sampled"; label: string }) {
  const { entry, disabled, onChange } = useEntry(material);
  return <EditableNumberCell label={`${label} ${material.name}`} value={entry[field]} min={0} disabled={disabled} onCommit={(value) => onChange(material.materialId, { [field]: value })} />;
}
function ReturnedCell({ material }: { material: PackingMaterial }) {
  return <>{show(useEntry(material).figures.returned, material.displayUnit)}</>;
}
function LossCell({ material }: { material: PackingMaterial }) {
  const { figures } = useEntry(material);
  return <span className={figures.needsReason ? "font-medium text-destructive" : ""}>{figures.percentLoss.toFixed(2)}%</span>;
}

const column = dataTableColumns<PackingMaterial>();
const quantity = (field: "packed" | "rejected" | "sampled", label: string) =>
  column.display({ id: field, header: label, size: 130, cell: ({ row }) => <QuantityCell material={row.original} field={field} label={label} /> });
const columns = column.columns([
  column.accessor("name", { header: "Material", cell: ({ row }) => <MaterialCell material={row.original} /> }),
  column.display({ id: "received", header: "Received", size: 150, cell: ({ row }) => { const material = row.original; return <div>
    <div>{show(fromSmallestUnit(material.total, material.displayUnit), material.displayUnit)}</div>
    {material.delivered > 0 ? <div className="text-xs text-muted-foreground">incl. {show(fromSmallestUnit(material.delivered, material.displayUnit), material.displayUnit)} extra</div> : null}</div>; } }),
  quantity("packed", "Packed"), quantity("rejected", "Rejected"), quantity("sampled", "Sampled"),
  column.display({ id: "returned", header: "To return", size: 120, cell: ({ row }) => <ReturnedCell material={row.original} /> }),
  column.display({ id: "loss", header: "Loss", size: 90, cell: ({ row }) => <LossCell material={row.original} /> }),
]);

/**
 * Accounts for every packaging material issued to the batch: how much was packed, rejected, and
 * sampled. What is left is returned to the warehouse, and the loss is worked out from what was rejected.
 */
export function MaterialsReconciliation({ materials, entries, showProblems, disabled, onChange }: {
  materials: readonly PackingMaterial[];
  entries: Readonly<Record<string, MaterialEntry>>;
  /** Problems are held back until the first attempt to save, so an untouched table is not full of errors. */
  showProblems: boolean;
  disabled: boolean;
  onChange: (materialId: string, patch: Partial<MaterialEntry>) => void;
}) {
  const editing = useMemo(() => ({ entries, showProblems, disabled, onChange }), [entries, showProblems, disabled, onChange]);
  return <EditingContext.Provider value={editing}>
    <ListDataTable label="Packing material reconciliation" columns={columns} rows={materials} getRowId={(material) => material.materialId}
      emptyTitle="No packaging materials were issued to this batch" emptyDescription="Final packing accounts for the materials on the batch's packaging requisition." />
  </EditingContext.Provider>;
}

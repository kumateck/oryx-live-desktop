import { useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { EditableNumberCell, ListDataTable, dataTableColumns } from "@/shared/datatable";
import { fromSmallestUnit, toLargestUnit } from "@/shared/units/quantity";
import { emptyEntry, materialFigures, type MaterialEntry, type PackingMaterial } from "../../lib/final-packing";

const column = dataTableColumns<PackingMaterial>();
const show = (value: number, unit: string) => toLargestUnit(value, unit, "calculated")?.text ?? "–";

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
  const columns = useMemo(() => {
    const input = (key: "packed" | "rejected" | "sampled", label: string) => column.display({ id: key, header: label, size: 130, cell: ({ row }) => {
      const material = row.original; const entry = entries[material.materialId] ?? emptyEntry;
      return <EditableNumberCell label={`${label} ${material.name}`} value={entry[key]} min={0} disabled={disabled} onCommit={(value) => onChange(material.materialId, { [key]: value })} />;
    } });
    return column.columns([
      column.accessor("name", { header: "Material", cell: ({ row }) => { const entry = entries[row.original.materialId] ?? emptyEntry; const figures = materialFigures(row.original, entry);
        return <div className="min-w-0 space-y-1"><div className="break-words font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.code || "No code"} · in {row.original.displayUnit || "units"}</div>
          {figures.needsReason ? <Textarea rows={2} aria-label={`Reason for the loss of ${row.original.name}`} placeholder="Reason for the loss" value={entry.reason} disabled={disabled}
            onChange={(event) => onChange(row.original.materialId, { reason: event.target.value })} /> : null}
          {showProblems && figures.problem ? <p role="alert" className="text-xs text-destructive">{figures.problem}</p> : null}</div>; } }),
      column.display({ id: "received", header: "Received", size: 150, cell: ({ row }) => { const material = row.original; return <div>
        <div>{show(fromSmallestUnit(material.total, material.displayUnit), material.displayUnit)}</div>
        {material.delivered > 0 ? <div className="text-xs text-muted-foreground">incl. {show(fromSmallestUnit(material.delivered, material.displayUnit), material.displayUnit)} extra</div> : null}</div>; } }),
      input("packed", "Packed"), input("rejected", "Rejected"), input("sampled", "Sampled"),
      column.display({ id: "returned", header: "To return", size: 120, cell: ({ row }) => show(materialFigures(row.original, entries[row.original.materialId] ?? emptyEntry).returned, row.original.displayUnit) }),
      column.display({ id: "loss", header: "Loss", size: 90, cell: ({ row }) => { const figures = materialFigures(row.original, entries[row.original.materialId] ?? emptyEntry);
        return <span className={figures.needsReason ? "font-medium text-destructive" : ""}>{figures.percentLoss.toFixed(2)}%</span>; } }),
    ]);
  }, [entries, showProblems, disabled, onChange]);
  return <ListDataTable label="Packing material reconciliation" columns={columns} rows={materials} getRowId={(material) => material.materialId}
    emptyTitle="No packaging materials were issued to this batch" emptyDescription="Final packing accounts for the materials on the batch's packaging requisition." />;
}

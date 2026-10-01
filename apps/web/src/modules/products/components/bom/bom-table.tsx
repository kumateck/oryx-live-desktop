import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { DraggableDataTable, dataTableColumns } from "@/shared/datatable";
import { toLargestUnit } from "@/shared/units/quantity";
import type { BomLine } from "../../lib/bom";
import { batchQuantity } from "../../lib/product-detail";

const column = dataTableColumns<BomLine>();
const dash = "–";

/** The formula's materials in step order. Dragging a row changes its step. */
export function BomLinesTable({ lines, compositionSize, batchSize, loading, error, onRetry, onReorder, onEdit, onRemove, disabled }: {
  lines: readonly BomLine[];
  compositionSize: number | null;
  batchSize: number | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onReorder: (lines: BomLine[]) => void;
  onEdit: (line: BomLine) => void;
  onRemove: (line: BomLine) => void;
  disabled: boolean;
}) {
  const columns = useMemo(() => column.columns([
    column.display({ id: "step", header: "Step", size: 60, cell: ({ row }) => row.index + 1 }),
    column.accessor((line) => line.code || dash, { id: "code", header: "Code", size: 120 }),
    column.accessor((line) => line.material.label, { id: "material", header: "Material", cell: ({ row }) => <div className="min-w-0">
      <div className="break-words">{row.original.material.label}</div>
      {row.original.substitutes.length ? <div className="break-words text-xs text-muted-foreground">
        Substitutes: {row.original.substitutes.map((item) => item.label).join(", ")}</div> : null}
    </div> }),
    column.accessor((line) => line.specification || dash, { id: "spec", header: "Spec ref" }),
    column.accessor((line) => toLargestUnit(line.baseQuantity, line.unit.symbol)?.text ?? dash, { id: "unit", header: "Unit qty" }),
    column.accessor((line) => toLargestUnit(batchQuantity(line.baseQuantity, compositionSize, batchSize), line.unit.symbol, "calculated")?.text ?? dash, { id: "batch", header: "Batch qty" }),
    column.accessor((line) => line.category || dash, { id: "function", header: "Function" }),
    column.accessor((line) => line.grade || dash, { id: "grade", header: "Grade", size: 90 }),
    column.display({ id: "actions", header: TableMenuHeader, size: 56, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.material.label}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, onSelect: () => onEdit(row.original) },
      { id: "remove", label: "Remove", icon: Trash2, destructive: true, onSelect: () => onRemove(row.original) },
    ]} /> }),
  ]), [compositionSize, batchSize, onEdit, onRemove]);
  return <DraggableDataTable label="Bill of materials" columns={columns} rows={lines} getRowId={(line) => line.key} loading={loading} error={error}
    onRetry={onRetry} disabled={disabled} describeRow={(line) => line.material.label} onReorder={(next) => onReorder(next)}
    emptyTitle="No materials yet" emptyDescription="Add the raw materials of this product's formula, then save." />;
}

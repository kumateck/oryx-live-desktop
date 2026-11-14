import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { DraggableDataTable, dataTableColumns } from "@/shared/datatable";
import { bomAudit } from "../../hooks/use-bom";
import { MaterialQuantity } from "../material-quantity";
import type { BomLine, BomSubstitute } from "../../lib/bom";
import { toLargestUnit } from "@/shared/units/quantity";
import { useProductWorkspace } from "../../hooks/use-product-workspace";
import { batchQuantity } from "../../lib/product-detail";

const column = dataTableColumns<BomLine>();

/** A substitute's own unit quantity, or that it still needs one. */
function substituteAmount(substitute: BomSubstitute, density: boolean): string {
  const unit = density ? "mg" : substitute.unit?.symbol;
  if (substitute.baseQuantity === null || !unit) return "quantity not set";
  return toLargestUnit(substitute.baseQuantity, unit, "entered")?.text ?? `${substitute.baseQuantity} ${unit}`;
}
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
  const { task, keys } = useProductWorkspace();
  const columns = useMemo(() => column.columns([
    column.display({ id: "step", header: "Step", size: 60, cell: ({ row }) => row.index + 1 }),
    column.accessor((line) => line.code || dash, { id: "code", header: "Code", size: 120 }),
    column.accessor((line) => line.material.label, { id: "material", header: "Material", cell: ({ row }) => <div className="min-w-0">
      <div className="break-words">{row.original.material.label}</div>
      {row.original.substitutes.length ? <div className="break-words text-xs text-muted-foreground">
        Substitutes: {row.original.substitutes.map((item) => `${item.label} (${substituteAmount(item, row.original.useDensityConversion)})`).join(", ")}</div> : null}
    </div> }),
    column.accessor((line) => line.specification || dash, { id: "spec", header: "Spec ref" }),
    column.accessor("baseQuantity", { id: "unit", header: "Unit qty", cell: ({ row }) => <MaterialQuantity materialId={row.original.material.value}
      known={row.original.useDensityConversion ? { id: "mg", symbol: "mg" } : row.original.linkedUnit ?? null} audit={bomAudit} value={row.original.baseQuantity} origin="entered" /> }),
    column.display({ id: "batch", header: "Batch qty", cell: ({ row }) => <MaterialQuantity materialId={row.original.material.value}
      known={row.original.useDensityConversion ? { id: "mg", symbol: "mg" } : row.original.linkedUnit ?? null} audit={bomAudit} value={batchQuantity(row.original.baseQuantity, compositionSize, batchSize)} origin="calculated" /> }),
    column.accessor((line) => line.category || dash, { id: "function", header: "Function" }),
    column.accessor((line) => line.grade || dash, { id: "grade", header: "Grade", size: 90 }),
    column.display({ id: "actions", header: TableMenuHeader, size: 56, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.material.label}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, require: task(keys.sections.bom.edit), onSelect: () => onEdit(row.original) },
      { id: "remove", label: "Remove", icon: Trash2, destructive: true, require: task(keys.sections.bom.delete ?? keys.sections.bom.edit), onSelect: () => onRemove(row.original) },
    ]} /> }),
  ]), [compositionSize, batchSize, onEdit, onRemove, task, keys]);
  return <DraggableDataTable label="Bill of materials" columns={columns} rows={lines} getRowId={(line) => line.key} loading={loading} error={error}
    onRetry={onRetry} disabled={disabled} describeRow={(line) => line.material.label} onReorder={(next) => onReorder(next)}
    emptyTitle="No materials yet" emptyDescription="Add the raw materials of this product's formula, then save." />;
}

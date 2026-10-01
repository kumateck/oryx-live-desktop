import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { packagingTotal, type PackagingLine } from "../../lib/packaging";
import { MaterialSpecRef } from "../material-spec-ref";

const column = dataTableColumns<PackagingLine>();
const dash = "–";

export function PackagingLinesTable({ lines, loading, error, onRetry, onEdit, onRemove }: {
  lines: readonly PackagingLine[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEdit: (line: PackagingLine) => void;
  onRemove: (line: PackagingLine) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.display({ id: "number", header: "#", size: 50, cell: ({ row }) => row.index + 1 }),
    column.accessor((line) => line.code || dash, { id: "code", header: "Code", size: 120 }),
    column.accessor((line) => line.material.label, { id: "material", header: "Component material" }),
    column.display({ id: "spec", header: "Spec ref", cell: ({ row }) => <MaterialSpecRef materialId={row.original.material.value} known={row.original.specification} /> }),
    column.accessor((line) => line.packing?.label ?? "All styles", { id: "packing", header: "Packing style" }),
    // Typed by the user: shown exactly as entered.
    column.accessor((line) => formatQuantityNumber(line.prescribedQuantity, "entered"), { id: "prescribed", header: "Prescribed qty", size: 120 }),
    column.accessor((line) => formatQuantityNumber(line.packingExcessMargin, "entered"), { id: "allowance", header: "Allowance", size: 100 }),
    column.accessor((line) => formatQuantityNumber(packagingTotal(line), "calculated"), { id: "total", header: "Total qty", size: 100 }),
    column.display({ id: "actions", header: () => <span className="sr-only">Actions</span>, size: 90, cell: ({ row }) => <span className="flex gap-1">
      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Edit ${row.original.material.label}`} onClick={() => onEdit(row.original)}><Pencil /></Button>
      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove ${row.original.material.label}`} onClick={() => onRemove(row.original)}><Trash2 /></Button>
    </span> }),
  ]), [onEdit, onRemove]);
  return <ListDataTable label="Packing materials" columns={columns} rows={lines} getRowId={(line) => line.key} loading={loading} error={error}
    onRetry={onRetry} emptyTitle="No packing materials yet" emptyDescription="Add the materials this product is packed in, then save." />;
}

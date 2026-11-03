import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { packagingTotal, type PackagingLine } from "../../lib/packaging";
import { MaterialSpecRef } from "../material-spec-ref";
import { PackagingQuantity } from "./packaging-quantity";

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
    column.display({ id: "number", header: "#", cell: ({ row }) => row.index + 1 }),
    column.accessor((line) => line.code || dash, { id: "code", header: "Code" }),
    column.accessor((line) => line.material.label, { id: "material", header: "Component material" }),
    column.display({ id: "spec", header: "Spec ref", cell: ({ row }) => <MaterialSpecRef materialId={row.original.material.value} known={row.original.specification} /> }),
    column.accessor((line) => line.packing?.label ?? "All styles", { id: "packing", header: "Packing style" }),
    // Typed by the user: shown exactly as entered.
    column.accessor("prescribedQuantity", { id: "prescribed", header: "Prescribed qty",
      cell: ({ row }) => <PackagingQuantity line={row.original} value={row.original.prescribedQuantity} origin="entered" /> }),
    column.accessor("packingExcessMargin", { id: "allowance", header: "Allowance",
      cell: ({ row }) => <PackagingQuantity line={row.original} value={row.original.packingExcessMargin} origin="entered" /> }),
    column.accessor(packagingTotal, { id: "total", header: "Total qty",
      cell: ({ row }) => <PackagingQuantity line={row.original} value={packagingTotal(row.original)} origin="calculated" /> }),
    column.display({ id: "actions", header: TableMenuHeader, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.material.label}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, onSelect: () => onEdit(row.original) },
      { id: "remove", label: "Remove", icon: Trash2, destructive: true, onSelect: () => onRemove(row.original) },
    ]} /> }),
  ]), [onEdit, onRemove]);
  return <ListDataTable label="Packing materials" columns={columns} rows={lines} getRowId={(line) => line.key} loading={loading} error={error}
    onRetry={onRetry} emptyTitle="No packing materials yet" emptyDescription="Add the materials this product is packed in, then save." />;
}

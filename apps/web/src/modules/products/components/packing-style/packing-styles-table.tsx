import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import type { PackingStyle } from "../../lib/packing-styles";

const column = dataTableColumns<PackingStyle>();
const dash = "–";

export function PackingStylesTable({ styles, loading, error, onRetry, onEdit, onRemove }: {
  styles: readonly PackingStyle[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEdit: (style: PackingStyle) => void;
  onRemove: (style: PackingStyle) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.display({ id: "number", header: "#", size: 50, cell: ({ row }) => row.index + 1 }),
    column.accessor("name", { header: "Packing style", cell: ({ row }) => <span className="flex flex-wrap items-center gap-2">{row.original.name}
      {row.original.isDefault ? <Badge variant="secondary">Default</Badge> : null}{row.original.id ? null : <Badge variant="outline">Not saved</Badge>}</span> }),
    column.accessor((style) => style.basePackingUom.label || dash, { id: "uom", header: "Base packing unit" }),
    column.accessor("basePackingQuantity", { header: "Base packing qty", size: 120 }),
    column.accessor((style) => style.expectedYield ?? dash, { id: "yield", header: "Expected yield", size: 120 }),
    column.accessor("packPerShipper", { header: "Packs per shipper", size: 120 }),
    column.display({ id: "units", header: "Units", cell: ({ row }) =>
      <ul className="space-y-0.5">{row.original.units.map((unit, index) => <li key={index}>{unit.quantity} {unit.uom.label}</li>)}</ul> }),
    column.accessor((style) => style.description || dash, { id: "description", header: "Description" }),
    column.display({ id: "actions", header: () => <span className="sr-only">Actions</span>, size: 90, cell: ({ row }) => <span className="flex gap-1">
      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Edit ${row.original.name}`} onClick={() => onEdit(row.original)}><Pencil /></Button>
      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove ${row.original.name}`} onClick={() => onRemove(row.original)}><Trash2 /></Button>
    </span> }),
  ]), [onEdit, onRemove]);
  return <ListDataTable label="Packing styles" columns={columns} rows={styles} getRowId={(style) => style.key} loading={loading} error={error}
    onRetry={onRetry} emptyTitle="No packing styles yet" emptyDescription="Add the ways this product is packed, then save." />;
}

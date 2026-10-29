import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { formatCount } from "@/shared/packing/packs";
import type { PackingStyle } from "../../lib/packing-styles";
import { PackingUnitsCell, PacksPerShipperCell } from "./packing-units-cell";

const column = dataTableColumns<PackingStyle>();
const dash = "–";

export function PackingStylesTable({ styles, baseUnit = null, loading, error, onRetry, onEdit, onRemove }: {
  styles: readonly PackingStyle[];
  /** The product's base unit, which base packing quantity is measured in (mg, ml…). */
  baseUnit?: string | null;
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
    column.accessor("basePackingQuantity", { header: "Base packing qty", size: 120, cell: ({ row }) =>
      `${formatCount(row.original.basePackingQuantity)}${baseUnit ? ` ${baseUnit}` : ""}` }),
    column.accessor((style) => style.expectedYield ?? null, { id: "yield", header: "Expected yield", size: 140, cell: ({ row }) =>
      row.original.expectedYield !== null && row.original.expectedYield !== undefined ? formatCount(row.original.expectedYield) : dash }),
    column.accessor("packPerShipper", { header: "Packs per shipper", size: 170, cell: ({ row }) =>
      <PacksPerShipperCell units={row.original.units} baseLabel={row.original.basePackingUom.label} packPerShipper={row.original.packPerShipper} /> }),
    column.display({ id: "units", header: "Units", size: 260, cell: ({ row }) =>
      <PackingUnitsCell units={row.original.units} baseLabel={row.original.basePackingUom.label} packPerShipper={row.original.packPerShipper} /> }),
    column.accessor((style) => style.description || dash, { id: "description", header: "Description" }),
    column.display({ id: "actions", header: TableMenuHeader, size: 56, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.name}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, onSelect: () => onEdit(row.original) },
      { id: "remove", label: "Remove", icon: Trash2, destructive: true, onSelect: () => onRemove(row.original) },
    ]} /> }),
  ]), [onEdit, onRemove, baseUnit]);
  return <ListDataTable label="Packing styles" columns={columns} rows={styles} getRowId={(style) => style.key} loading={loading} error={error}
    onRetry={onRetry} emptyTitle="No packing styles yet" emptyDescription="Add the ways this product is packed, then save." />;
}

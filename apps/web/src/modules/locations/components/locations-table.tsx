import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { locationChangeBlock, locationLabel, locationPermissions, storeTypeLabel } from "@/modules/warehouses/lib/store-rules";
import type { StoreLocation } from "@/modules/warehouses/schemas/store-schema";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { RichTextView } from "@/shared/rich-text/rich-text-view";

const column = dataTableColumns<StoreLocation>();

export function LocationsTable({ rows, search, paging, loading, refreshing, error, onRetry, onEdit, onRemove }: {
  rows: readonly StoreLocation[]; search: string;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; onEdit: (location: StoreLocation) => void; onRemove: (location: StoreLocation) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor((row) => locationLabel(row.name), { id: "name", header: "Location", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{locationLabel(row.original.name) || "Unnamed"}</div>
      <div className="text-xs text-muted-foreground">{row.original.floor ? `${row.original.floor} floor` : "Floor not recorded"}</div></div> }),
    column.accessor((row) => row.store ?? "", { id: "store", header: "Store", cell: ({ row }) => <div className="min-w-0"><div className="break-words">{row.original.store ?? "–"}</div>
      <div className="text-xs text-muted-foreground">{storeTypeLabel(row.original.storeType)}</div></div> }),
    column.accessor("racks", { header: "Racks", size: 110 }),
    column.accessor((row) => row.description ?? "", { id: "description", header: "Description", cell: ({ row }) => row.original.description ? <RichTextView html={row.original.description} className="text-sm" /> : <span className="text-muted-foreground">–</span> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => { const used = locationChangeBlock(row.original) ? { disabled: true, disabledReason: "The location has racks" } : {};
      return <TableMenu label={`Actions for ${locationLabel(row.original.name)}, ${row.original.store ?? "store"}`} items={[
        { id: "edit", label: "Edit", icon: Pencil, require: locationPermissions.edit, onSelect: () => onEdit(row.original) },
        { id: "remove", label: "Remove", icon: Trash2, require: locationPermissions.remove, destructive: true, separated: true, onSelect: () => onRemove(row.original), ...used }]} />; } }),
  ]), [onEdit, onRemove]);
  return <ServerDataTable label="Locations" columns={columns} rows={rows} getRowId={(row) => row.id} {...paging} loading={loading} refreshing={refreshing} error={error} onRetry={onRetry}
    emptyTitle={search.trim() ? "No locations match this search" : "No locations"} emptyDescription={search.trim() ? "Search by location name." : "Add a location to a store to stand racks in."} />;
}

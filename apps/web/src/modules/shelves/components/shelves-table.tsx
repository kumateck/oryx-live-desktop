import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { shelfPermissions } from "@/modules/racks/lib/rack-access";
import type { StorageShelf } from "@/modules/racks/schemas/rack-schema";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { RichTextView } from "@/shared/rich-text/rich-text-view";

const column = dataTableColumns<StorageShelf>();

export function ShelvesTable({ rows, search, paging, loading, refreshing, error, onRetry, onEdit, onRemove }: {
  rows: readonly StorageShelf[]; search: string;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; onEdit: (shelf: StorageShelf) => void; onRemove: (shelf: StorageShelf) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor("code", { header: "Shelf", size: 220, cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.code || "No code"}</div>
      <div className="break-words text-xs text-muted-foreground">{row.original.name || "No name"}</div></div> }),
    column.accessor((row) => row.rack ?? "", { id: "rack", header: "Rack", size: 160, cell: ({ row }) => row.original.rack ?? "–" }),
    column.accessor((row) => row.location ?? "", { id: "location", header: "Location", cell: ({ row }) => <div className="min-w-0"><div className="break-words">{row.original.location ?? "–"}</div>
      <div className="break-words text-xs text-muted-foreground">{row.original.warehouse ?? "Store not recorded"}</div></div> }),
    column.accessor("description", { header: "Description", cell: ({ row }) => row.original.description ? <RichTextView html={row.original.description} className="text-sm" /> : <span className="text-muted-foreground">–</span> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for shelf ${row.original.code || row.original.name}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, require: shelfPermissions.edit, onSelect: () => onEdit(row.original) },
      { id: "remove", label: "Remove", icon: Trash2, require: shelfPermissions.remove, destructive: true, separated: true, onSelect: () => onRemove(row.original) }]} /> }),
  ]), [onEdit, onRemove]);
  return <ServerDataTable label="Shelves" columns={columns} rows={rows} getRowId={(row) => row.id} {...paging} loading={loading} refreshing={refreshing} error={error} onRetry={onRetry}
    emptyTitle={search.trim() ? "No shelves match this search" : "No shelves"} emptyDescription={search.trim() ? "Search by shelf code or name, rack, location or store." : "Add a shelf to a rack to keep stock on it."} />;
}

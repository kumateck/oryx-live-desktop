import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { storeChangeBlock, storePermission, storeTypeLabel } from "../lib/store-rules";
import type { Store } from "../schemas/store-schema";

const column = dataTableColumns<Store>();

export function StoresTable({ rows, search, paging, loading, refreshing, error, onRetry, onEdit, onRemove }: {
  rows: readonly Store[]; search: string;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; onEdit: (store: Store) => void; onRemove: (store: Store) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Store", cell: ({ row }) => <span className="break-words font-medium">{row.original.name}</span> }),
    column.accessor((row) => storeTypeLabel(row.type), { id: "type", header: "Used for", size: 200, cell: ({ row }) => <Badge variant="outline">{storeTypeLabel(row.original.type)}</Badge> }),
    column.accessor("locations", { header: "Locations", size: 130 }),
    column.accessor((row) => row.description ?? "", { id: "description", header: "Description", cell: ({ row }) => row.original.description ? <RichTextView html={row.original.description} className="text-sm" /> : <span className="text-muted-foreground">–</span> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => { const used = storeChangeBlock(row.original) ? { disabled: true, disabledReason: "The store has locations" } : {};
      return <TableMenu label={`Actions for ${row.original.name}`} items={[
        { id: "edit", label: "Edit", icon: Pencil, require: storePermission, onSelect: () => onEdit(row.original) },
        { id: "remove", label: "Remove", icon: Trash2, require: storePermission, destructive: true, separated: true, onSelect: () => onRemove(row.original), ...used }]} />; } }),
  ]), [onEdit, onRemove]);
  return <ServerDataTable label="Stores" columns={columns} rows={rows} getRowId={(row) => row.id} {...paging} loading={loading} refreshing={refreshing} error={error} onRetry={onRetry}
    emptyTitle={search.trim() ? "No stores match this search" : "No stores"} emptyDescription={search.trim() ? "Search by store name." : "Add a store to keep stock in."} />;
}

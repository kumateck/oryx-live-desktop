import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { rackPermissions } from "../lib/rack-access";
import { rackRemoveBlock } from "../lib/rack-rules";
import type { StorageRack } from "../schemas/rack-schema";

const column = dataTableColumns<StorageRack>();

export function RacksTable({ rows, search, paging, loading, refreshing, error, onRetry, onEdit, onRemove }: {
  rows: readonly StorageRack[]; search: string;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; onEdit: (rack: StorageRack) => void; onRemove: (rack: StorageRack) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Rack", size: 160, cell: ({ row }) => <span className="font-medium">{row.original.name}</span> }),
    column.accessor((row) => row.location ?? "", { id: "location", header: "Location", cell: ({ row }) => <div className="min-w-0"><div className="break-words">{row.original.location ?? "–"}</div>
      <div className="break-words text-xs text-muted-foreground">{[row.original.warehouse, row.original.floor].filter(Boolean).join(" · ") || "Store not recorded"}</div></div> }),
    column.accessor((row) => row.shelves.length, { id: "shelves", header: "Shelves", size: 190, cell: ({ row }) => { const holding = row.original.shelves.filter((shelf) => shelf.inStock).length;
      return <div><div>{row.original.shelves.length} {row.original.shelves.length === 1 ? "shelf" : "shelves"}</div>
        <div className="text-xs text-muted-foreground">{holding === 0 ? "None holding stock" : `${holding} holding stock`}</div></div>; } }),
    column.accessor((row) => row.description ?? "", { id: "description", header: "Description", cell: ({ row }) => row.original.description ? <RichTextView html={row.original.description} className="text-sm" /> : <span className="text-muted-foreground">–</span> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => { const block = rackRemoveBlock(row.original);
      return <TableMenu label={`Actions for rack ${row.original.name}`} items={[
        { id: "edit", label: "Edit", icon: Pencil, require: rackPermissions.edit, onSelect: () => onEdit(row.original) },
        { id: "remove", label: "Remove", icon: Trash2, require: rackPermissions.remove, destructive: true, separated: true, onSelect: () => onRemove(row.original),
          ...(block ? { disabled: true, disabledReason: "Shelves still hold stock" } : {}) }]} />; } }),
  ]), [onEdit, onRemove]);
  return <ServerDataTable label="Racks" columns={columns} rows={rows} getRowId={(row) => row.id} {...paging} loading={loading} refreshing={refreshing} error={error} onRetry={onRetry}
    emptyTitle={search.trim() ? "No racks match this search" : "No racks"} emptyDescription={search.trim() ? "Search by rack name or description." : "Add a rack to give the store shelves to keep stock on."} />;
}

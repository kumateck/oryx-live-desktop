import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { TableMenu, TableMenuHeader } from "@/shared/actions/table-menu";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import type { ClientDataTableProps } from "@/shared/datatable/components/client-data-table";
import { collectionEditReason, type CollectionDefinition } from "../lib/collections";
import type { CollectionRow } from "../schemas/collection-schema";

const column = dataTableColumns<CollectionRow>();
const getRowId = (row: CollectionRow) => row.id;
interface Props extends Omit<ClientDataTableProps<CollectionRow>, "columns" | "getRowId"> {
  definition: CollectionDefinition;
  busy: boolean;
  onEdit: (row: CollectionRow) => void;
  onRemove: (row: CollectionRow) => void;
}

/** Owns the collection-specific columns and permission-aware row actions. */
export function CollectionTable({ definition, busy, onEdit, onRemove, ...table }: Props) {
  const columns = useMemo(() => {
    const editReason = collectionEditReason(definition);
    return column.columns([
      column.accessor("name", { header: "Name", cell: ({ row }) => <span className="break-words font-medium">{row.original.name}</span> }),
      ...(definition.mode === "units" ? [column.accessor((row) => row.symbol || "—", { id: "symbol", header: "Symbol", size: 100 })] : []),
      ...(definition.description ? [column.accessor((row) => row.description || "—", { id: "description", header: "Description",
        cell: ({ row }) => <p className="break-words text-muted-foreground">{row.original.description || "—"}</p> })] : []),
      ...(definition.mode === "read-only" ? [] : [column.display({ id: "actions", header: TableMenuHeader, size: 48, enableSorting: false,
        cell: ({ row }) => <TableMenu label={`Actions for ${row.original.name}`} disabled={busy} items={[
          { id: "edit", label: "Edit", icon: Pencil, require: definition.permissions.edit, disabled: Boolean(editReason),
            ...(editReason ? { disabledReason: editReason } : {}), onSelect: () => onEdit(row.original) },
          { id: "delete", label: "Remove", icon: Trash2, destructive: true, require: definition.permissions.delete, onSelect: () => onRemove(row.original) },
        ]} /> })]),
    ]);
  }, [definition, busy, onEdit, onRemove]);

  return <ClientDataTable {...table} columns={columns} getRowId={getRowId} />;
}

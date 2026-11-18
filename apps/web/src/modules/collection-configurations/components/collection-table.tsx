import { useMemo } from "react";
import { Link2, Link2Off, Pencil, Trash2 } from "lucide-react";
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
  onLinkDepartment: (row: CollectionRow) => void;
  onUnlinkDepartment: (row: CollectionRow) => void;
}

/** Owns the collection-specific columns and permission-aware row actions. */
export function CollectionTable({ definition, busy, onEdit, onRemove, onLinkDepartment, onUnlinkDepartment, ...table }: Props) {
  const columns = useMemo(() => {
    const editReason = collectionEditReason(definition);
    const departments = definition.departments;
    return column.columns([
      column.accessor("name", { header: "Name", cell: ({ row }) => <span className="break-words font-medium">{row.original.name}</span> }),
      ...(definition.mode === "units" ? [column.accessor((row) => row.symbol || "—", { id: "symbol", header: "Symbol", size: 100 })] : []),
      ...(definition.description ? [column.accessor((row) => row.description || "—", { id: "description", header: "Description",
        cell: ({ row }) => <p className="break-words text-muted-foreground">{row.original.description || "—"}</p> })] : []),
      ...(departments ? [column.accessor((row) => row.linkedDepartmentName || "", { id: "department", header: "Department", size: 180,
        cell: ({ row }) => row.original.linkedDepartmentId
          ? <span className="break-words">{row.original.linkedDepartmentName || "Unnamed department"}</span>
          : <span className="text-muted-foreground">Not linked</span> })] : []),
      ...(definition.mode === "read-only" ? [] : [column.display({ id: "actions", header: TableMenuHeader, size: 48, enableSorting: false,
        cell: ({ row }) => <TableMenu label={`Actions for ${row.original.name}`} disabled={busy} items={[
          { id: "edit", label: "Edit", icon: Pencil, require: definition.permissions.edit, disabled: Boolean(editReason),
            ...(editReason ? { disabledReason: editReason } : {}), onSelect: () => onEdit(row.original) },
          ...(departments ? [
            { id: "link-department", label: "Link to department", icon: Link2, require: departments.link,
              disabled: Boolean(row.original.linkedDepartmentId),
              ...(row.original.linkedDepartmentId ? { disabledReason: "Unlink the current department first." } : {}),
              onSelect: () => onLinkDepartment(row.original) },
            { id: "unlink-department", label: "Unlink department", icon: Link2Off, require: departments.unlink,
              disabled: !row.original.linkedDepartmentId,
              ...(row.original.linkedDepartmentId ? {} : { disabledReason: "This operation is not linked to a department." }),
              onSelect: () => onUnlinkDepartment(row.original) },
          ] : []),
          { id: "delete", label: "Remove", icon: Trash2, destructive: true, require: definition.permissions.delete, onSelect: () => onRemove(row.original) },
        ]} /> })]),
    ]);
  }, [definition, busy, onEdit, onRemove, onLinkDepartment, onUnlinkDepartment]);

  return <ClientDataTable {...table} columns={columns} getRowId={getRowId} />;
}

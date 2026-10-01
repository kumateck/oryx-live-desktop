import { useMemo } from "react";
import { UserAvatar } from "@/shared/auth/user-avatar";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import type { UserAccess } from "../hooks/use-user-access";
import type { UserRow } from "../schemas/user-schema";
import { UserRowActions, type UserAction } from "./user-row-actions";

const column = dataTableColumns<UserRow>();
const userId = (user: UserRow) => user.id;

interface UsersTableProps {
  rows: readonly UserRow[];
  access: UserAccess;
  onAction: (action: UserAction, user: UserRow) => void;
  search: string;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRetry: () => void;
  inactive: boolean;
}

export function UsersTable({ rows, access, onAction, search, paging, loading, refreshing, error, onRetry, inactive }: UsersTableProps) {
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Name", cell: ({ row }) => <span className="flex min-w-0 items-center gap-2">
      <UserAvatar user={row.original} size="sm" /><span className="min-w-0 break-words">{row.original.name}</span></span> }),
    column.accessor("email", { header: "Email" }),
    column.accessor((user) => user.role?.displayName || user.role?.name || "No role", { id: "role", header: "Role" }),
    column.accessor((user) => user.department ?? "No department", { id: "department", header: "Department" }),
    column.display({ id: "actions", header: () => <span className="sr-only">Actions</span>, size: 64, enableHiding: false,
      cell: ({ row }) => <UserRowActions user={row.original} access={access} onAction={onAction} /> }),
  ]), [access, onAction]);

  return <ServerDataTable label="Users" columns={columns} rows={rows} getRowId={userId} {...paging} loading={loading}
    refreshing={refreshing} error={error} onRetry={onRetry} onRowOpen={(user) => onAction("details", user)}
    emptyTitle={search.trim() ? "No users match this search" : inactive ? "No blocked users" : "No users yet"}
    emptyDescription={search.trim() ? "Check the spelling or search by email." : undefined} />;
}

import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { rolesPath } from "../lib/permissions";
import { departmentTypeLabel } from "../lib/role-types";
import type { RoleRow } from "../schemas/role-schema";

const column = dataTableColumns<RoleRow>();
const columns = column.columns([
  column.accessor("name", { header: "Role" }),
  column.accessor("displayName", { header: "Display name" }),
  column.accessor((role) => departmentTypeLabel(role.type), { id: "type", header: "Department type" }),
  column.display({ id: "actions", header: () => <span className="sr-only">Actions</span>, size: 130, enableSorting: false, cell: ({ row }) =>
    <Button asChild size="sm" variant="ghost"><Link to={`${rolesPath}/${row.original.id}`}>View details</Link></Button> }),
]);
const roleId = (role: RoleRow) => role.id;

export function RolesTable({ roles, loading, refreshing, error, onRetry }: {
  roles: RoleRow[];
  loading?: boolean;
  refreshing?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  const navigate = useNavigate();
  return <ClientDataTable label="Roles" columns={columns} rows={roles} getRowId={roleId} loading={loading} refreshing={refreshing}
    error={error} onRetry={onRetry} emptyTitle="No roles found" emptyDescription="Try a different search, or create a role."
    onRowOpen={(role) => void navigate(`${rolesPath}/${role.id}`)} />;
}

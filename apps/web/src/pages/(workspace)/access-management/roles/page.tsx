import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { RolesTable } from "../../../../modules/roles/components/roles-table";
import { rolePermissions, rolesPath } from "../../../../modules/roles/lib/permissions";
import { useRolesList } from "../../../../modules/roles/hooks/use-roles-list";

export default function RolesPage() {
  const { access, query, parsed, roles } = useRolesList();
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">ACCESS MANAGEMENT</p><h1 className="text-xl font-semibold">Roles</h1></div>
      <PermissionGuard require={rolePermissions.create}><Button asChild size="sm"><Link to={`${rolesPath}/create`}>Create role</Link></Button></PermissionGuard>
    </div>
    <RolesTable roles={roles} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading}
      error={query.error || (parsed && !parsed.success) ? apiErrorMessage(query.error) : null} onRetry={() => void query.refetch()} />
  </section>;
}

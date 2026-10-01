import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1RoleByIdQuery } from "../../../../../modules/roles/api/role-api";
import { DeleteRoleDialog } from "../../../../../modules/roles/components/delete-role-dialog";
import { RoleEditor } from "../../../../../modules/roles/components/role-editor";
import { useRoleAccess } from "../../../../../modules/roles/hooks/use-role-access";
import { audit, rolesPath } from "../../../../../modules/roles/lib/permissions";
import { roleRowSchema } from "../../../../../modules/roles/schemas/role-schema";
import { permissionCatalogSchema } from "../../../../../modules/roles/schemas/permission-schema";

export default function RoleDetailPage() {
  const { id } = useParams();
  const access = useRoleAccess();
  const query = useGetApiV1RoleByIdQuery({ ...audit, id: id ?? "" }, { skip: !access.view || !id });
  if (!id) return <p role="alert">The role address is invalid.</p>;
  const role = query.data ? roleRowSchema.safeParse(query.data) : null;
  const assigned = query.data?.permissions ? permissionCatalogSchema.safeParse(query.data.permissions) : null;
  return <section className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">ACCESS MANAGEMENT</p>
      <h1 className="text-xl font-semibold">{role?.success ? role.data.displayName : "Role details"}</h1></div>
      <div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link to={rolesPath}>Back to roles</Link></Button>
        {access.delete && role?.success && !role.data.isManager ? <DeleteRoleDialog id={role.data.id} name={role.data.displayName} /> : null}</div></div>
    {role?.success && role.data.isManager ? <p className="text-sm text-muted-foreground">This managed role cannot be renamed or deleted.</p> : null}
    {query.isLoading ? <p role="status" className="flex items-center gap-2"><Spinner />Loading role…</p> :
      query.error || !role?.success || !assigned?.success ?
        <div role="alert" className="space-y-2"><p>{apiErrorMessage(query.error)}</p>
          <Button variant="outline" size="sm" onClick={() => void query.refetch()}>Retry</Button></div> :
        <RoleEditor role={role.data} assigned={assigned.data} canEdit={access.edit && !role.data.isManager}
          canUpdatePermissions={access.updatePermissions} />}
  </section>;
}

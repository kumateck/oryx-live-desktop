import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { CreateRoleForm } from "../../../../../modules/roles/components/create-role-form";
import { useGetApiV1PermissionModulesQuery } from "../../../../../modules/roles/api/role-api";
import { audit, rolesPath } from "../../../../../modules/roles/lib/permissions";
import { useRoleAccess } from "../../../../../modules/roles/hooks/use-role-access";
import { permissionCatalogSchema } from "../../../../../modules/roles/schemas/permission-schema";

export default function CreateRolePage() {
  const access = useRoleAccess();
  const query = useGetApiV1PermissionModulesQuery(audit, { skip: !access.create });
  const catalog = query.data ? permissionCatalogSchema.safeParse(query.data) : null;
  return <section className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">ACCESS MANAGEMENT</p>
      <h1 className="text-xl font-semibold">Create role</h1></div>
      <Button asChild variant="outline" size="sm"><Link to={rolesPath}>Back to roles</Link></Button></div>
    {query.isLoading ? <p role="status" className="flex items-center gap-2"><Spinner />Loading permissions…</p> :
      query.error || !catalog?.success ? <div role="alert" className="space-y-2"><p>{apiErrorMessage(query.error)}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>Retry</Button></div> :
        <CreateRoleForm available={catalog.data} />}
  </section>;
}

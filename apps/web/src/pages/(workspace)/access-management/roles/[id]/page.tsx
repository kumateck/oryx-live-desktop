import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/navigation/page-header";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1RoleByIdQuery } from "../../../../../modules/roles/api/role-api";
import { DeleteRoleDialog } from "../../../../../modules/roles/components/delete-role-dialog";
import { RoleEditor } from "../../../../../modules/roles/components/role-editor";
import { useRoleAccess } from "../../../../../modules/roles/hooks/use-role-access";
import { audit } from "../../../../../modules/roles/lib/permissions";
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
    <PageHeader title={query.isLoading ? null : role?.success ? role.data.displayName : "Role details"}
      crumbs={[{ label: query.isLoading ? null : role?.success ? role.data.displayName : "Role" }]}
      actions={access.delete && role?.success && !role.data.isManager ? <DeleteRoleDialog id={role.data.id} name={role.data.displayName} /> : undefined} />
    {role?.success && role.data.isManager ? <p className="text-sm text-muted-foreground">This managed role cannot be renamed or deleted.</p> : null}
    {query.isLoading ? <FormPageSkeleton label="Loading role" sections={[3, 6]} columns="lg:grid-cols-2" /> :
      query.error || !role?.success || !assigned?.success ?
        <div role="alert" className="space-y-2"><p>{apiErrorMessage(query.error)}</p>
          <Button variant="outline" size="sm" onClick={() => void query.refetch()}>Retry</Button></div> :
        <RoleEditor role={role.data} assigned={assigned.data} canEdit={access.edit && !role.data.isManager}
          canUpdatePermissions={access.updatePermissions} />}
  </section>;
}

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useSession } from "@/shared/auth/session-provider";
import { usePutApiV1PermissionRoleByRoleIdMutation, usePutApiV1RoleByIdMutation } from "../api/role-api";
import { accessOverrides, applyAccessOverrides, audit } from "../lib/permissions";
import { departmentTypeFromValue, departmentTypes } from "../lib/role-types";
import { roleEditSchema, type RoleEditValues, type RoleRow } from "../schemas/role-schema";
import type { PermissionModule } from "../schemas/permission-schema";
import { PermissionPicker } from "./permission-picker";

const fields = [
  { type: "text", name: "name", label: "Role name", required: true },
  { type: "text", name: "displayName", label: "Display name", required: true },
  { type: "select", name: "type", label: "Department type", mode: "single", source: "sync", options: departmentTypes, required: true },
] as const satisfies readonly WizardField<RoleEditValues>[];

export function RoleEditor({ role, assigned, canEdit, canUpdatePermissions }: {
  role: RoleRow;
  assigned: PermissionModule[];
  canEdit: boolean;
  canUpdatePermissions: boolean;
}) {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const permissions = useMemo(() => applyAccessOverrides(assigned, overrides), [assigned, overrides]);
  const { refresh } = useSession();
  const [updateRole, roleMutation] = usePutApiV1RoleByIdMutation();
  const [updatePermissions, permissionMutation] = usePutApiV1PermissionRoleByRoleIdMutation();
  const form = useForm<RoleEditValues>({ resolver: zodResolver(roleEditSchema), defaultValues: {
    name: role.name, displayName: role.displayName,
    type: { ...departmentTypes[role.type] },
  } });

  const saveDetails = form.handleSubmit(async (values) => {
    const result = await updateRole({ ...audit, id: role.id, domainEntitiesRolesUpdateRoleRequest: {
      name: values.name, displayName: values.displayName, type: departmentTypeFromValue(values.type.value),
    } });
    if ("error" in result) toast.error("Role details were not saved", { description: apiErrorMessage(result.error) });
    else toast.success("Role details saved");
  });

  const savePermissions = async () => {
    const result = await updatePermissions({ ...audit, roleId: role.id, body: permissions });
    if ("error" in result) { toast.error("Permissions were not saved", { description: apiErrorMessage(result.error) }); return; }
    setOverrides({});
    toast.success("Permissions saved");
    // The signed-in user may hold this role: pick up the change without leaving the page.
    void refresh();
  };

  return <div className="min-w-0 space-y-4">
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <form noValidate onSubmit={(event) => void saveDetails(event)} className="min-w-0 space-y-4 rounded-lg border bg-card p-4">
        <h2 className="text-base font-semibold">Role details</h2>
        <fieldset disabled={!canEdit || roleMutation.isLoading}><FormWizard form={form} fields={fields} /></fieldset>
        {canEdit ? <Button type="submit" size="sm" disabled={roleMutation.isLoading}>
          {roleMutation.isLoading ? <><Spinner />Saving…</> : "Save details"}</Button> : null}
      </form>
      <div className="min-w-0 space-y-3">
        <PermissionPicker modules={permissions} onChange={(next) => setOverrides(accessOverrides(assigned, next))}
          disabled={!canUpdatePermissions || permissionMutation.isLoading} />
        {canUpdatePermissions ? <Button type="button" size="sm" disabled={permissionMutation.isLoading || !Object.keys(overrides).length}
          onClick={() => void savePermissions()}>{permissionMutation.isLoading ? <><Spinner />Saving…</> : "Save permissions"}</Button> : null}
      </div>
    </div>
  </div>;
}

import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useGetApiV1RoleQuery, useGetApiV1PermissionModulesQuery, useGetApiV1PermissionRoleByRoleIdQuery, usePutApiV1PermissionRoleByRoleIdMutation } from "@/modules/roles/api/role-api";
import { accessOverrides, applyAccessOverrides, describeChanges } from "@/modules/roles/lib/permissions";
import { mergePermissionCatalog } from "@/modules/roles/lib/permission-groups";
import { permissionCatalogSchema, type PermissionModule } from "@/modules/roles/schemas/permission-schema";
import { roleRowSchema } from "@/modules/roles/schemas/role-schema";
import { useSession } from "@/shared/auth/session-provider";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { SelectOption } from "@/shared/forms/form-wizard-types";

const audit = { module: "Access Management", subModule: "Manage Permissions" } as const;
export const permissionKeys = { view: "CanViewPermissions", update: "CanUpdateExistingPermission", reset: "CanResetPermission", roles: "CanViewRoles" } as const;
const empty: PermissionModule[] = [];

export function usePermissionsWorkspace() {
  const { has, allowsNow } = useAccess();
  const { refresh } = useSession();
  const [role, setRole] = useState<SelectOption | null>(null);
  const [pendingRole, setPendingRole] = useState<SelectOption | null>(null);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const roles = useGetApiV1RoleQuery(audit);
  const catalog = useGetApiV1PermissionModulesQuery(audit, { skip: !role });
  const assignments = useGetApiV1PermissionRoleByRoleIdQuery({ ...audit, roleId: role?.value ?? "" }, { skip: !role });
  const [update, mutation] = usePutApiV1PermissionRoleByRoleIdMutation();
  const roleList = useMemo(() => z.array(roleRowSchema).safeParse(roles.data), [roles.data]);
  const options = useMemo(() => roleList.success ? roleList.data.map((item) => ({ value: item.id, label: item.displayName })) : [], [roleList]);
  const parsed = useMemo(() => ({ catalog: permissionCatalogSchema.safeParse(catalog.currentData), assignments: permissionCatalogSchema.safeParse(assignments.currentData) }), [catalog.currentData, assignments.currentData]);
  const base = useMemo(() => parsed.catalog.success && parsed.assignments.success ? mergePermissionCatalog(parsed.catalog.data, parsed.assignments.data) : empty, [parsed]);
  const permissions = useMemo(() => applyAccessOverrides(base, overrides), [base, overrides]);
  // The overrides only ever hold real differences from what the role has, so their number is the number of changes.
  const changes = Object.keys(overrides).length;
  const review = useMemo(() => describeChanges(base, overrides), [base, overrides]);
  const loading = Boolean(role) && ((!catalog.currentData && catalog.isFetching) || (!assignments.currentData && assignments.isFetching));
  const error = catalog.error ? apiErrorMessage(catalog.error) : assignments.error ? apiErrorMessage(assignments.error)
    : role && !loading && (!parsed.catalog.success || !parsed.assignments.success) ? "The server returned permissions the app could not read." : null;
  const chooseRole = (next: SelectOption) => {
    if (mutation.isLoading || next.value === role?.value) return;
    if (changes) setPendingRole(next);
    else { setOverrides({}); setRole(next); }
  };
  const save = async (): Promise<string | null> => {
    if (!role || !allowsNow(permissionKeys.update) || error || loading || mutation.isLoading) return "Permissions cannot be saved right now.";
    const result = await update({ ...audit, roleId: role.value, body: permissions });
    if ("error" in result) return apiErrorMessage(result.error);
    setOverrides({});
    toast.success(`Permissions of ${role.label} saved`);
    void refresh();
    return null;
  };
  return {
    role, pendingRole, options, changes, review, permissions, loading, error, saving: mutation.isLoading,
    rolesLoading: roles.isLoading,
    rolesError: roles.error ? apiErrorMessage(roles.error) : !roles.isLoading && !roleList.success ? "The server returned roles the app could not read." : null,
    mayUpdate: has(permissionKeys.update), mayReset: has(permissionKeys.reset), mayManageRoles: has(permissionKeys.roles),
    chooseRole, save, change: (next: PermissionModule[]) => { if (allowsNow(permissionKeys.update) && !mutation.isLoading) setOverrides(accessOverrides(base, next)); },
    reset: () => setOverrides({}), close: () => { setOverrides({}); setRole(null); }, cancelRoleChange: () => setPendingRole(null),
    discardAndChangeRole: () => { if (pendingRole) { setOverrides({}); setRole(pendingRole); setPendingRole(null); } },
    retry: () => { void catalog.refetch(); void assignments.refetch(); }, retryRoles: () => { void roles.refetch(); },
  };
}

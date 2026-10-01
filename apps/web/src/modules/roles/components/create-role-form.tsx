import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePostApiV1RoleMutation } from "../api/role-api";
import { PermissionPicker } from "./permission-picker";
import { audit, clearAccess, rolesPath } from "../lib/permissions";
import { departmentTypeFromValue, departmentTypes } from "../lib/role-types";
import { roleCreateSchema, type RoleCreateValues } from "../schemas/role-schema";
import type { PermissionModule } from "../schemas/permission-schema";

const fields = [
  { type: "text", name: "name", label: "Role name", required: true, placeholder: "e.g. Quality Analyst" },
  { type: "select", name: "type", label: "Department type", mode: "single", source: "sync", options: departmentTypes, required: true },
] as const satisfies readonly WizardField<RoleCreateValues>[];

export function CreateRoleForm({ available }: { available: PermissionModule[] }) {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState(() => clearAccess(available));
  const [message, setMessage] = useState("");
  const [createRole, mutation] = usePostApiV1RoleMutation();
  const form = useForm<RoleCreateValues>({ resolver: zodResolver(roleCreateSchema), defaultValues: { name: "" } });
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const result = await createRole({ ...audit, domainEntitiesRolesCreateRoleRequest: {
      name: values.name, type: departmentTypeFromValue(values.type.value), permissions,
    } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(`${values.name} was created`);
    void navigate(rolesPath, { replace: true });
  });
  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-5">
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <section className="min-w-0 space-y-4 rounded-lg border bg-card p-4">
        <h2 className="text-base font-semibold">Role details</h2><FormWizard form={form} fields={fields} />
      </section>
      <PermissionPicker modules={permissions} onChange={setPermissions} disabled={mutation.isLoading} />
    </div>
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => void navigate(rolesPath)}>Cancel</Button>
      <Button type="submit" disabled={mutation.isLoading}>{mutation.isLoading ? <><Spinner />Creating…</> : "Create role"}</Button></div>
  </form>;
}

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { usePostApiV1EmployeeUserMutation } from "../api/user-api";
import { useEmployeeOptions } from "../hooks/use-employee-options";
import { audit, usersPath, userPermissions } from "../lib/user-access";
import { createUserSchema, type CreateUserValues, type RoleOption } from "../schemas/user-schema";
import { InputTypes } from "@/shared/forms/input-types";

export function CreateUserForm({ roles }: { roles: readonly RoleOption[] }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const permission = usePermissionAction(userPermissions.create);
  const [createUser, mutation] = usePostApiV1EmployeeUserMutation();
  const { loadOptions, employeeById } = useEmployeeOptions();
  const form = useForm<CreateUserValues>({ resolver: zodResolver(createUserSchema) });
  const employee = employeeById(useWatch({ control: form.control, name: "employee" })?.value);

  const fields = useMemo(() => [
    { type: InputTypes.SELECT, name: "employee", label: "Employee", mode: "single", source: "async", loadOptions, required: true,
      placeholder: "Select an employee", searchPlaceholder: "Search employees",
      description: "Only active employees without a user account are listed." },
    { type: InputTypes.SELECT, name: "role", label: "Role", mode: "single", source: "sync", required: true, placeholder: "Select a role",
      options: roles.map((role) => ({ value: role.id, label: role.label })) },
  ] as const satisfies readonly WizardField<CreateUserValues>[], [loadOptions, roles]);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const result = await createUser({ ...audit, domainEntitiesEmployeesEmployeeUserDto: { employeeId: values.employee.value, roleId: values.role.value } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(`A user account was created for ${values.employee.label}`);
    void navigate(usersPath, { replace: true });
  });

  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 max-w-xl space-y-5">
    <section className="space-y-4 rounded-lg border bg-card p-4">
      <FormWizard form={form} fields={fields} />
      {employee ? <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-1 rounded-md bg-muted/50 p-3 text-sm">
        <dt className="text-muted-foreground">Email</dt><dd className="break-words">{employee.email ?? "No email address on record"}</dd>
        <dt className="text-muted-foreground">Department</dt><dd className="break-words">{employee.department ?? "No department"}</dd>
      </dl> : null}
    </section>
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" disabled={mutation.isLoading} onClick={() => void navigate(usersPath)}>Cancel</Button>
      <Button type="submit" disabled={!permission.allowed || mutation.isLoading}>{mutation.isLoading ? <><Spinner />Creating…</> : "Create user"}</Button>
    </div>
  </form>;
}

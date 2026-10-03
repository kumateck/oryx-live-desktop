import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { usePostApiV1AuthUserResetPasswordMutation } from "@/shared/api/generated/auth";
import { useSession } from "@/shared/auth/session-provider";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { passwordSchema, passwordFailure, emptyPasswords, type PasswordValues } from "../schemas/password-schema";

const fields: readonly WizardField<PasswordValues>[] = [
  { type: InputTypes.PASSWORD, name: "currentPassword", label: "Current password", required: true, autoComplete: "current-password" },
  { type: InputTypes.PASSWORD, name: "newPassword", label: "New password", required: true, autoComplete: "new-password", description: "Use at least 8 characters. Your server may require additional password rules." },
  { type: InputTypes.PASSWORD, name: "confirmNewPassword", label: "Confirm new password", required: true, autoComplete: "new-password" },
];
export function PasswordForm() {
  const form = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: emptyPasswords });
  const [change, changing] = usePostApiV1AuthUserResetPasswordMutation();
  const { logout } = useSession();
  const [error, setError] = useState("");
  const save = form.handleSubmit(async (values) => {
    setError("");
    const result = await change({ module: "Authentication", subModule: "Change Password", domainEntitiesAuthUserPasswordChangeRequest: values });
    if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
    const failure = passwordFailure(result.data);
    if (failure) { setError(failure); return; }
    form.reset(emptyPasswords); toast.success("Password changed. Sign in again with your new password."); await logout();
  });
  return <PermissionGuard require="CanChangePassword"><form className="max-w-lg space-y-4" noValidate onSubmit={(event) => { event.preventDefault(); void save(); }}>
    <fieldset disabled={changing.isLoading}><FormWizard form={form} fields={fields} /></fieldset>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    <p className="text-xs text-muted-foreground">After a confirmed change, you will be signed out on this device.</p>
    <Button type="submit" disabled={changing.isLoading}>{changing.isLoading ? <><Spinner />Changing password…</> : "Change password"}</Button>
  </form></PermissionGuard>;
}

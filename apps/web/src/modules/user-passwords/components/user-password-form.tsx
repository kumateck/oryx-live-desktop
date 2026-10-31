import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions/confirm-action-dialog";
import { passwordAdminAccess } from "@/shared/auth/password-admin";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { useSetUserPassword, type PasswordChange } from "../hooks/use-set-user-password";
import { useUserOptions } from "../hooks/use-user-options";
import { emptyUserPassword, userPasswordSchema, type UserPasswordValues } from "../schemas/user-password-schema";
import { PasswordRuleHints } from "./password-rule-hints";

const passwordFields: readonly WizardField<UserPasswordValues>[] = [
  { type: InputTypes.PASSWORD, name: "newPassword", label: "New password", required: true, autoComplete: "new-password" },
];
const confirmFields: readonly WizardField<UserPasswordValues>[] = [
  { type: InputTypes.PASSWORD, name: "confirmPassword", label: "Confirm new password", required: true, autoComplete: "new-password" },
];

/** Pick a user, type their new password twice, confirm, and save. */
export function UserPasswordForm() {
  const form = useForm<UserPasswordValues>({ resolver: zodResolver(userPasswordSchema), defaultValues: emptyUserPassword });
  const loadUsers = useUserOptions();
  const { save, saving, state, clear } = useSetUserPassword();
  const [pending, setPending] = useState<PasswordChange | null>(null);
  const newPassword = useWatch({ control: form.control, name: "newPassword" });
  const userFields = useMemo((): readonly WizardField<UserPasswordValues>[] => [
    { type: InputTypes.SELECT, name: "user", label: "User", mode: "single", source: "async", loadOptions: loadUsers, required: true,
      placeholder: "Search by name or email", searchPlaceholder: "Search users" },
  ], [loadUsers]);

  const review = form.handleSubmit((values) => {
    if (!values.user) return;
    clear();
    setPending({ userId: values.user.value, userLabel: values.user.label, newPassword: values.newPassword });
  });
  const confirm = async (change: PasswordChange) => {
    if (await save(change)) form.reset(emptyUserPassword);
    return null;
  };

  return <>
    <form className="max-w-lg space-y-4" noValidate onSubmit={(event) => { event.preventDefault(); void review(); }}>
      <fieldset disabled={saving} className="space-y-4">
        <FormWizard form={form} fields={userFields} />
        <div className="space-y-2"><FormWizard form={form} fields={passwordFields} /><PasswordRuleHints value={newPassword} /></div>
        <FormWizard form={form} fields={confirmFields} />
      </fieldset>
      {state.status === "failed" ? <p role="alert" className="break-words text-sm text-destructive">{state.message}</p> : null}
      {state.status === "saved" ? <p role="status" className="flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm">
        <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
        <span className="break-words">Password changed for {state.userLabel}. Their other sessions have been signed out. Give them the new password privately.</span>
      </p> : null}
      <Button type="submit" disabled={saving}>Change password</Button>
    </form>
    {pending ? <ConfirmActionDialog require={passwordAdminAccess} destructive={false}
      title={`Change the password for ${pending.userLabel}?`}
      description="Their current password stops working at once and they are signed out of other sessions. They will need the new password to sign in."
      confirmLabel="Change password" busyLabel="Changing password…" onClose={() => setPending(null)} onConfirm={() => confirm(pending)} /> : null}
  </>;
}

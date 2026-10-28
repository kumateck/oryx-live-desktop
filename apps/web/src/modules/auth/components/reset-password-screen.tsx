import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { setPasswordWithKey } from "@/shared/auth/session-api";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { forgotPasswordPath, loginPath } from "../lib/auth-paths";
import { resetKey, resetPasswordSchema, type ResetPasswordValues } from "../schemas/password-reset-schema";
import { AuthShell } from "./auth-shell";

const fields = [
  { type: InputTypes.PASSWORD, name: "password", label: "New password", autoComplete: "new-password", required: true, description: "At least 8 characters, with a digit, a capital letter and a symbol." },
  { type: InputTypes.PASSWORD, name: "confirmPassword", label: "Confirm the new password", autoComplete: "new-password", required: true },
] as const satisfies readonly WizardField<ResetPasswordValues>[];

/** Without a key in the address, the link from the email can be pasted. */
function PasteLink({ onKey }: { onKey: (key: string) => void }) {
  const [link, setLink] = useState("");
  const [problem, setProblem] = useState("");
  return <form noValidate className="space-y-4" onSubmit={(event) => { event.preventDefault(); const key = resetKey(link); if (key) onKey(key); else setProblem("This is not a reset link from Oryx. Copy the whole link from the email."); }}>
    <div className="space-y-1.5"><label htmlFor="reset-link" className="text-sm font-medium">Link from the email</label>
      <Input id="reset-link" value={link} aria-invalid={problem ? true : undefined} onChange={(event) => { setLink(event.target.value); setProblem(""); }} placeholder="https://…/reset-password?key=…" /></div>
    {problem ? <p role="alert" className="text-sm text-destructive">{problem}</p> : null}
    <Button type="submit" className="h-9 w-full">Continue</Button>
    <p className="text-center text-sm text-muted-foreground">No email? <Link to={forgotPasswordPath} className="text-primary underline-offset-2 hover:underline">Ask for a new link</Link></p>
  </form>;
}

/** Sets a new password with the key from a reset email, then sends the user to sign in with it. */
export function ResetPasswordScreen() {
  const [params] = useSearchParams();
  const [key, setKey] = useState(() => resetKey(params.get("key")));
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const form = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", confirmPassword: "" } });
  const submit = form.handleSubmit(async ({ password, confirmPassword }) => {
    if (!key) return;
    setMessage("");
    try {
      const failure = await setPasswordWithKey(key, password, confirmPassword);
      if (failure) { setMessage(failure); form.reset({ password: "", confirmPassword: "" }); return; }
      setDone(true);
    } catch { setMessage("Cannot reach the customer server. Try again."); }
  });
  if (done) return <AuthShell title="Password changed" subtitle="Sign in with your new password">
    <Button asChild className="h-9 w-full"><Link to={loginPath} replace>Sign in</Link></Button>
  </AuthShell>;
  if (!key) return <AuthShell title="Set a new password" subtitle="Paste the link from your password reset email"><PasteLink onKey={setKey} /></AuthShell>;
  return <AuthShell title="Set a new password" subtitle="Choose the password you will sign in with">
    <form noValidate onSubmit={(event) => void submit(event)} className="space-y-5">
      <FormWizard form={form} fields={fields} className="gap-5" />
      {message ? <p role="alert" className="text-sm text-destructive">{message} {/link/.test(message) ? <Link to={forgotPasswordPath} className="text-primary underline-offset-2 hover:underline">Ask for a new link</Link> : null}</p> : null}
      <Button type="submit" className="h-9 w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <><Spinner />Saving…</> : "Set new password"}</Button>
      <Button asChild variant="ghost" className="w-full"><Link to={loginPath}>Back to sign in</Link></Button>
    </form>
  </AuthShell>;
}

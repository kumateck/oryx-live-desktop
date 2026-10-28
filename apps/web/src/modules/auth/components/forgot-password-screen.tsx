import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { requestPasswordReset, SessionRequestError } from "@/shared/auth/session-api";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { loginPath, resetPasswordPath } from "../lib/auth-paths";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../schemas/password-reset-schema";
import { AuthShell } from "./auth-shell";

const fields = [{ type: InputTypes.EMAIL, name: "email", label: "Email address", autoComplete: "username", required: true }] as const satisfies readonly WizardField<ForgotPasswordValues>[];

/** Asks for a password reset link by email. The same answer is given whether or not an account uses the address. */
export function ForgotPasswordScreen() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const form = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });
  const submit = form.handleSubmit(async ({ email }) => {
    setMessage("");
    try { await requestPasswordReset(email.trim()); setSentTo(email.trim()); }
    catch (error) { setMessage(error instanceof SessionRequestError ? error.message : "Cannot reach the customer server. Try again."); }
  });
  if (sentTo) return <AuthShell title="Check your email" subtitle="A reset link is on its way">
    <div className="space-y-4 text-sm">
      <p role="status">If an account uses <span className="font-medium">{sentTo}</span>, an email with a link to set a new password has been sent to it. The link works for two days.</p>
      <p className="text-muted-foreground">The link opens in your browser. If you would rather finish here, <Link to={resetPasswordPath} className="text-primary underline-offset-2 hover:underline">paste the link</Link> instead.</p>
      <Button asChild variant="outline" className="w-full"><Link to={loginPath}>Back to sign in</Link></Button>
    </div>
  </AuthShell>;
  return <AuthShell title="Forgot your password?" subtitle="Enter your email address and we will send you a link to set a new one">
    <form noValidate onSubmit={(event) => void submit(event)} className="space-y-5">
      <FormWizard form={form} fields={fields} className="gap-5" />
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <Button type="submit" className="h-9 w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <><Spinner />Sending…</> : "Send reset link"}</Button>
      <Button asChild variant="ghost" className="w-full"><Link to={loginPath}>Back to sign in</Link></Button>
    </form>
  </AuthShell>;
}

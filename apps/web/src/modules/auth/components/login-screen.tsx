import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { SessionRequestError } from "@/shared/auth/session-api";
import { useSession, type SignedOutReason } from "@/shared/auth/session-provider";
import { forgotPasswordPath } from "../lib/auth-paths";
import { returnPath } from "../lib/return-path";
import { AuthShell } from "./auth-shell";
import { loginSchema, type LoginValues } from "../schemas/login-schema";
import { InputTypes } from "@/shared/forms/input-types";

const fields = [
  { type: InputTypes.EMAIL, name: "email", label: "Email address", autoComplete: "username", required: true },
  { type: InputTypes.PASSWORD, name: "password", label: "Password", autoComplete: "current-password", required: true },
] as const satisfies readonly WizardField<LoginValues>[];

function signedOutNotice(reason: SignedOutReason | null): string | null {
  if (reason === "expired") return "Your session ended. Sign in again to continue where you left off.";
  if (reason === "disabled") return "This account is disabled. Contact your administrator.";
  if (reason === "signed-out") return "You have signed out.";
  return null;
}

export function LoginScreen() {
  const { state, login, retry } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [message, setMessage] = useState("");
  const destination = returnPath(params.get("next"));
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  if (state.status === "authenticated") return <Navigate to={destination} replace />;
  if (state.status === "loading") return <div className="boot-state" role="status"><Spinner />Checking your session…</div>;
  if (state.status === "error") return <div className="boot-state flex-col gap-3" role="alert">
    <p>{state.message}</p>
    <Button type="button" variant="outline" onClick={() => void retry()}>Retry</Button>
  </div>;

  const submit = form.handleSubmit(async ({ email, password }) => {
    setMessage("");
    try {
      await login(email.trim(), password);
      form.reset({ email: "", password: "" });
      void navigate(destination, { replace: true });
    } catch (error) {
      // Never keep a rejected password in the form; the user retypes it.
      form.resetField("password");
      form.setFocus(error instanceof SessionRequestError && error.reason === "credentials" ? "password" : "email");
      setMessage(error instanceof SessionRequestError ? error.message : "Cannot reach the customer server. Try again.");
    }
  });
  const notice = message ? null : signedOutNotice(state.status === "anonymous" ? state.reason : null);

  return <AuthShell title="Welcome back" subtitle="Sign in to your Oryx workspace">
    <form noValidate onSubmit={(event) => void submit(event)} className="space-y-5">
      <FormWizard form={form} fields={fields} className="gap-5" />
      <p className="-mt-2 text-right text-sm"><Link to={forgotPasswordPath} className="text-primary underline-offset-2 hover:underline">Forgot your password?</Link></p>
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      {notice ? <p role="status" className="rounded-md border bg-muted/50 px-3 py-2 text-sm">{notice}</p> : null}
      <Button type="submit" className="h-9 w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <><Spinner />Signing in…</> : "Sign in"}
      </Button>
    </form>
    <p className="text-center text-xs leading-relaxed text-muted-foreground">
      The desktop keeps your sign-in securely when you close Oryx, until you sign out or the server ends your session.
    </p>
  </AuthShell>;
}

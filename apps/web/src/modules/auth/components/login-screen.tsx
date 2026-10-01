import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { SessionRequestError } from "@/shared/auth/session-api";
import { useSession, type SignedOutReason } from "@/shared/auth/session-provider";
import { useTheme } from "@/shared/theme/theme-provider";
import sideImageUrl from "../../../../../../assets/login-side.jpg";
import wordmarkUrl from "../../../../../../assets/oryx-wordmark.svg";
import { returnPath } from "../lib/return-path";
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
  const theme = useTheme();
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

  return <main className="relative flex min-h-dvh min-w-0 items-center justify-center overflow-y-auto bg-muted/30 p-4 text-foreground sm:p-8">
    <Button type="button" variant="outline" size="icon-sm" aria-label="Toggle theme"
      className="absolute right-4 top-4 sm:right-8 sm:top-8" onClick={theme.toggle}>
      {theme.resolved === "dark" ? <Sun /> : <Moon />}
    </Button>
    <section className="grid w-full max-w-5xl overflow-hidden rounded-xl border bg-card shadow-sm md:grid-cols-2">
      <div className="flex min-w-0 flex-col justify-center p-7 sm:p-10 lg:p-14">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="space-y-4 text-center">
            <span className="mx-auto block h-10 w-28 bg-[var(--brand)] [mask-repeat:no-repeat] [mask-size:contain]"
              role="img" aria-label="Oryx" style={{ maskImage: `url("${wordmarkUrl}")` }} />
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Sign in to your Oryx workspace</p>
            </div>
          </div>
          <form noValidate onSubmit={(event) => void submit(event)} className="space-y-5">
            <FormWizard form={form} fields={fields} className="gap-5" />
            {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
            {notice ? <p role="status" className="rounded-md border bg-muted/50 px-3 py-2 text-sm">{notice}</p> : null}
            <Button type="submit" className="h-9 w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <><Spinner />Signing in…</> : "Sign in"}
            </Button>
          </form>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Your session is secured by your customer server and lasts for one work shift.
          </p>
        </div>
      </div>
      <div className="relative hidden min-h-[520px] md:order-first md:block">
        <img src={sideImageUrl} alt="" decoding="async" className="absolute inset-0 size-full object-cover object-left" />
      </div>
    </section>
  </main>;
}

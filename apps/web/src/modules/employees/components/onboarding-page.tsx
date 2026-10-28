import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useParams, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { loadCountries, readInvitation, submitOnboarding, uploadOnboardingPhoto, type Invitation } from "../api/onboarding-api";
import { EmployeeType, employeeTypeLabels } from "../lib/access";
import { personalFields } from "../lib/employee-fields";
import { employeePayload } from "../lib/employee-payload";
import { employeeSchema, emptyEmployee, type EmployeeValues } from "../schemas/employee-schema";
import { EmployeeFormFields, type NationalityChoices } from "./employee-form-sections";

// HR sets the staff number; the email comes from the invitation and is shown, not edited.
const named = (f: (typeof personalFields)[number]) => ("name" in f ? f.name : null);
const onboardingPersonal = personalFields.filter((f) => named(f) !== "staffNumber").map((f) => named(f) === "email" ? { ...f, disabled: true, description: "From your invitation." } : f);
const unreachable = "Cannot reach the server. Check your connection and try again.";
type Stage = { kind: "loading" } | { kind: "refused"; message: string } | { kind: "form"; invitation: Invitation } | { kind: "photo"; message: string } | { kind: "done" };

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-dvh overflow-y-auto bg-muted/30 p-4 text-foreground sm:p-8"><div className="mx-auto w-full max-w-5xl space-y-5 rounded-xl border bg-card p-5 shadow-sm sm:p-8">{children}</div></main>;
}

function useNationalities(): NationalityChoices {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const load = useCallback(() => {
    setProblem(null);
    loadCountries().then((r) => { if (r.ok) setOptions(r.value); else setProblem(r.message); }, () => setProblem(unreachable));
  }, []);
  useEffect(load, [load]);
  return useMemo(() => ({ options, problem, retry: load }), [options, problem, load]);
}

/** The signed-out form a new hire fills in from their emailed invitation. */
export function OnboardingPage() {
  const { type } = useParams();
  const [params] = useSearchParams();
  const token = params.get("token")?.trim() ?? "";
  const [stage, setStage] = useState<Stage>({ kind: "loading" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const photo = useRef<File | null>(null);
  const nationalities = useNationalities();
  const form = useForm<EmployeeValues>({ resolver: zodResolver(employeeSchema), defaultValues: emptyEmployee() });
  useEffect(() => {
    if (!token) { setStage({ kind: "refused", message: "This invitation link is incomplete. Open the whole link from your email." }); return; }
    let live = true;
    readInvitation(token).then((r) => {
      if (!live) return;
      if (!r.ok) { setStage({ kind: "refused", message: r.message }); return; }
      if (type !== String(r.value.employeeType)) { setStage({ kind: "refused", message: "This link has been changed. Open the link exactly as it is in your email." }); return; }
      const [first = "", ...rest] = (r.value.name ?? "").trim().split(/\s+/);
      form.reset({ ...emptyEmployee(), email: r.value.email, firstName: first, lastName: rest.join(" ") });
      setStage({ kind: "form", invitation: r.value });
    }, () => { if (live) setStage({ kind: "refused", message: unreachable }); });
    return () => { live = false; };
  }, [token, type, form]);

  const sendPhoto = async () => {
    if (!photo.current) { setStage({ kind: "done" }); return; }
    const result = await uploadOnboardingPhoto(token, photo.current).catch(() => ({ ok: false as const, code: null, message: unreachable }));
    if (result.ok) { photo.current = null; setStage({ kind: "done" }); return; }
    setStage({ kind: "photo", message: result.message });
  };
  const submit = form.handleSubmit(async (values) => {
    if (stage.kind !== "form" || busy) return;
    setBusy(true); setError("");
    try {
      const kind = stage.invitation.employeeType === EmployeeType.Permanent ? EmployeeType.Permanent : EmployeeType.Casual;
      const result = await submitOnboarding(token, employeePayload({ ...values, email: stage.invitation.email, staffNumber: "", photo: null }, kind))
        .catch(() => ({ ok: false as const, code: null, message: unreachable }));
      if (!result.ok) { setError(result.message); if (result.code?.startsWith("Onboarding.")) setStage({ kind: "refused", message: result.message }); return; }
      photo.current = values.photo;
      await sendPhoto();
    } finally { setBusy(false); }
  });

  if (stage.kind === "loading") return <Shell><FormPageSkeleton label="Opening your invitation" /></Shell>;
  if (stage.kind === "refused") return <Shell><h1 className="text-xl font-semibold">Employee onboarding</h1><p role="alert" className="text-sm text-destructive">{stage.message}</p></Shell>;
  if (stage.kind === "done") return <Shell><h1 className="text-xl font-semibold">Thank you</h1><p role="status" className="text-sm">Your details have been sent to HR. You can close this page.</p></Shell>;
  if (stage.kind === "photo") return <Shell><h1 className="text-xl font-semibold">Your details were sent</h1>
    <p role="alert" className="text-sm">HR has your form, but the photograph did not upload: {stage.message}</p>
    <div className="flex gap-2"><Button disabled={busy} onClick={() => { setBusy(true); void sendPhoto().finally(() => setBusy(false)); }}>{busy ? <><Spinner />Uploading…</> : "Try the photograph again"}</Button>
      <Button variant="outline" disabled={busy} onClick={() => setStage({ kind: "done" })}>Finish without it</Button></div></Shell>;
  const label = employeeTypeLabels[stage.invitation.employeeType] ?? "New";
  return <Shell>
    <header className="space-y-1"><p className="eyebrow">ORYX</p><h1 className="text-xl font-semibold">{label} employee onboarding</h1>
      <p className="text-sm text-muted-foreground">For {stage.invitation.email}. The link works once; fill in everything before you send it.</p></header>
    <form noValidate className="space-y-5" onSubmit={(event) => void submit(event)}>
      <fieldset disabled={busy}><EmployeeFormFields form={form} nationalities={nationalities} personal={onboardingPersonal} /></fieldset>
      {Object.keys(form.formState.errors).length ? <p role="alert" className="text-sm text-destructive">Check the highlighted fields before sending.</p> : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={busy}>{busy ? <><Spinner />Sending…</> : "Send my details"}</Button>
    </form>
  </Shell>;
}

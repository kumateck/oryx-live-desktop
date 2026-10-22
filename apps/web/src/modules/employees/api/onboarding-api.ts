import { z } from "zod";
import type { DomainEntitiesEmployeesCreateEmployeeRequest } from "@/shared/api/generated/hr";
import { json, send } from "@/shared/auth/session-transport";

// The onboarding form is signed out: these calls carry the invitation token instead of a session.
const audit = { "Content-Type": "application/json", Module: "HR Management", SubModule: "Onboarding" };
const problemSchema = z.object({ errors: z.array(z.object({ code: z.string(), description: z.string().nullish() })).min(1) });
const invitationSchema = z.object({ email: z.string(), name: z.string().nullish(), employeeType: z.number(), expiresAt: z.string() });
const countriesSchema = z.array(z.object({ id: z.string().nullish(), name: z.string().nullish() }));
export type Invitation = z.infer<typeof invitationSchema>;
export type OnboardingResult<T> = { ok: true; value: T } | { ok: false; code: string | null; message: string };

async function failure(response: Response): Promise<{ ok: false; code: string | null; message: string }> {
  const problem = problemSchema.safeParse(await json(response));
  const first = problem.success ? problem.data.errors[0] : undefined;
  if (first) return { ok: false, code: first.code, message: first.description || "The server refused this." };
  return { ok: false, code: null, message: response.status >= 500 ? "The server could not do this. Try again shortly." : "The server refused this." };
}

async function post(path: string, body: object): Promise<Response> {
  return send(path, { method: "POST", headers: audit, body: JSON.stringify(body) });
}

/** Who the invitation is for, if its link is still valid. */
export async function readInvitation(token: string): Promise<OnboardingResult<Invitation>> {
  const response = await post("/api/v1/onboarding/invitation", { token });
  if (!response.ok) return failure(response);
  const parsed = invitationSchema.safeParse(await json(response));
  return parsed.success ? { ok: true, value: parsed.data } : { ok: false, code: null, message: "The server sent an invitation the form could not read." };
}

/** Submits the form once. The server takes the email and employee type from the invitation. */
export async function submitOnboarding(token: string, employee: DomainEntitiesEmployeesCreateEmployeeRequest): Promise<OnboardingResult<string>> {
  const response = await post("/api/v1/onboarding/submit", { token, employee });
  if (!response.ok) return failure(response);
  const id = z.string().safeParse(await json(response));
  return id.success ? { ok: true, value: id.data } : { ok: false, code: null, message: "The form was sent but the server did not confirm it. Do not send it again; contact HR." };
}

/** Adds the passport photograph just after the form was submitted. */
export async function uploadOnboardingPhoto(token: string, file: File): Promise<OnboardingResult<null>> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("unreadable"));
    reader.onerror = () => reject(new Error("unreadable"));
    reader.readAsDataURL(file);
  });
  const response = await post("/api/v1/onboarding/photo", { token, file: dataUrl });
  return response.ok ? { ok: true, value: null } : failure(response);
}

/** Nationalities for the form; the list is public. */
export async function loadCountries(): Promise<OnboardingResult<{ value: string; label: string }[]>> {
  const response = await send("/api/v1/countries", { method: "GET", headers: { Module: audit.Module, SubModule: audit.SubModule } });
  if (!response.ok) return failure(response);
  const parsed = countriesSchema.safeParse(await json(response));
  return parsed.success ? { ok: true, value: parsed.data.flatMap((c) => c.id && c.name ? [{ value: c.id, label: c.name }] : []) } : { ok: false, code: null, message: "The nationality list could not be read." };
}
